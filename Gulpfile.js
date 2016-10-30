
/* CONFIGURATION */
// Change this if you use a different location for your test inputs/outputs
const TEST_DIR = '../tests/'
// Change if you want to test a different part of the project
const PART = 2
/* END CONFIGURATION */

const gulp = require('gulp')
const changed = require('gulp-changed')
const gulpFunction = require('gulp-function').default
const q = require("q")
var request = require('request')
var fs = require('fs');
var cheerio = require('cheerio')
var path = require('path')

const ACL = "https://cmsc420.cs.umd.edu/meeshquest/part" + PART + "/input/"
const ACL_UPLOAD = path.join(ACL, 'upload_file/')
const INPUTS = path.join(TEST_DIR, 'input/*.xml')
const INPUT_SCRAPED_DEST = path.join(TEST_DIR, 'input-scraped/')
const OUTPUT_DEST = path.join(TEST_DIR, 'output/')

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
	console.log("File changed: " + input)

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
				done.reject(err);
			} else {
				// Get the URL of the results page and scrape the output from that page.
				resultURL = resp.headers['location'];
				scrapeOutput(resultURL, function(output, err) {
					if (err) {
						done.reject(err);
					} else {
						// Write the canonical output to a file.
						fs.writeFile(OUTPUT_DEST + input, output, function(err) {
							if(err) {
								done.reject(err);
							} else {
								console.log("Scraped: " + input)
								done.resolve()
							}
						});
					}
				})
			}
		});
		var form = req.form();
		form.append('rawfile', fs.createReadStream(file.path))
		form.append('csrfmiddlewaretoken', token)
	});

	return done.promise
}

gulp.task('default', function() {
	return gulp.src(INPUTS)
		// Get only the changed files
		.pipe(changed(INPUT_SCRAPED_DEST))
		// Pass to the ACL scraper
		.pipe(gulpFunction(writeCanonicalOutput, 'forEach'))
		// Store which input files that have been scraped
		.pipe(gulp.dest(INPUT_SCRAPED_DEST));
});
