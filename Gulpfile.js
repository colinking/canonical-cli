
/* CONFIGURATION */
const MEESHQUEST_PART = 3
const ROOT_DIR = '../'
// Relative to ROOT_DIR:
const TEST_DIR = 'tests/'
const JAR_FILE = 'out/artifacts/MeeshQuest/meeshquest.jar'
const ANT_BUILD_FILE = 'meeshquest.xml'
const DIFF_CMD = 'icdiff -U50 --cols=200' // or just the usual 'diff'
/* END CONFIGURATION */

const gulp = require('gulp')
const changed = require('gulp-changed')
const shell = require('gulp-shell')
const gulpif = require('gulp-if')
const gulpFunction = require('gulp-function').default
const q = require('q')
const request = require('request')
const fs = require('fs')
const cheerio = require('cheerio')
const path = require('path')
const argv = require('yargs').argv;

const ACL = 'https://cmsc420.cs.umd.edu/meeshquest/part' + MEESHQUEST_PART + '/input/'
const ACL_UPLOAD = ACL + 'upload_file/'
const INPUT_DEST = path.resolve(ROOT_DIR, TEST_DIR, 'input')
const INPUTS = path.resolve(INPUT_DEST, '*')
const INPUT_SCRAPED_DEST = path.resolve(ROOT_DIR, TEST_DIR, 'input-scraped/')
const OUTPUT_DEST = path.resolve(ROOT_DIR, TEST_DIR, 'output/')
const MY_OUTPUT_DEST = path.resolve(ROOT_DIR, TEST_DIR, 'my-output/')

// Submits a GET request to the ACL to get a valid CSRF token.
const getCSRF = function(cb) {
	request.get(ACL, function (err, resp, body) {
		if (err) {
			cb(null, err)
		} else {
			var $ = cheerio.load(body)
			token = $('input[name="csrfmiddlewaretoken"]').val().trim()
			cb(token)
		}
	})
}

// Scrapes the canonical output from a given ACL url.
const scrapeOutput = function(url, cb) {
	request(url, function (err, resp, body) {
		if (!err && resp.statusCode == 200) {
			var $ = cheerio.load(body)
			output = $('.jumbotron textarea').text().trim()
			cb(output)
		} else {
			cb(null, error)
		}
	})
}

// Submits a Vinyl file to the ACL and writes the canonical output to a file
// in the OUTPUT_DEST directory with the same name as the input file.
const writeCanonicalOutput = function(file) {
	const done = q.defer()

	input = file.relative
	console.log('File changed: ' + input)

	getCSRF(function(token) {
		// Configure the POST request with valid CSRF headers.
		// The input file is uploaded below.
		var req = request({
			url: ACL_UPLOAD,
			method: 'POST',
			headers: {
				'Referer': ACL,
				'Cookie': 'csrftoken=' + token
			}
		}, function (err, resp, body) {
			if (err) {
        console.error(err)
				done.reject(err)
			} else if (resp.headers['location'] == undefined) {
				err = new Error("Upload of input file failed. Your XML may not be valid.")
				console.error(err)
				done.reject(err)
			} else {
				// Get the URL of the results page and scrape the output from that page.
				resultURL = resp.headers['location']
				scrapeOutput(resultURL, function(output, err) {
					if (err) {
            console.error(err)
						done.reject(err)
					} else {
						// Write the canonical output to a file.
						fs.writeFile(path.join(OUTPUT_DEST, input), output, function(err) {
							if(err) {
                console.error(err)
								done.reject(err)
							} else {
								console.log('Scraped: ' + input)
								done.resolve()
							}
						})
					}
				})
			}
		})
		var form = req.form()
		form.append('rawfile', fs.createReadStream(file.path))
		form.append('csrfmiddlewaretoken', token)
	})

	return done.promise
}

gulp.task('build', shell.task('ant -quiet -f ' + path.resolve(ROOT_DIR, ANT_BUILD_FILE)))

gulp.task('run', ['build', 'scrape'], function () {
  return gulp.src((argv.f == undefined ? INPUTS : path.join(INPUT_DEST, String(argv.f))), {read: false})
        .pipe(shell([
          'echo <%= base(file.path) %>',
          'cd ' + ROOT_DIR + ' && java -jar ' + JAR_FILE + ' < <%= file.path %> > <%= myoutput(file.path) %>'
        ], {
          templateData: {
            base: function(file) {
              return path.basename(file)
            },
            myoutput: function (file) {
              return path.join(MY_OUTPUT_DEST, path.basename(file))
            }
          }
        }))
})

gulp.task('scrape', function() {
	return gulp.src((argv.f == undefined ? INPUTS : path.join(INPUT_DEST, String(argv.f))))
		// Get only the changed files unless a specific file is specified
		.pipe(gulpif(argv.force === undefined, changed(INPUT_SCRAPED_DEST)))
		// Pass to the ACL scraper
		.pipe(gulpFunction(writeCanonicalOutput, 'forEach'))
		// Store which input files that have been scraped
		.pipe(gulp.dest(INPUT_SCRAPED_DEST))
})

gulp.task('diff', ['run'], function() {
	return gulp.src((argv.f == undefined ? MY_OUTPUT_DEST : path.join(MY_OUTPUT_DEST, String(argv.f))), {read: false})
    .pipe(shell([
      DIFF_CMD + ' <%= output(file.path) %> <%= myoutput(file.path) %>'
    ], {
      templateData: {
        myoutput: function (file) {
          return path.join(MY_OUTPUT_DEST, path.basename(file))
        },
        output: function (file) {
          return path.join(OUTPUT_DEST, path.basename(file))
        }
      }
    }))
})
