# canonical-cli

- Submits XML inputs to the [CMSC420 ACL](https://cmsc420.cs.umd.edu/meeshquest/part1/input/) and saves the output to your file system.
- Build your project's JAR file from the command line.
- Runs your project on input files from the command line.

# Installation

> The following descriptions are for IntelliJ on macOS, but can be done with any editor/OS (with a bit of translation).

Make sure you have set up a build artifact to generate your JAR file (`File -> Project Structure... -> Artifacts`), like normal. This script assumes you have one called `MeeshQuest` that generates a `meeshquest.jar`, however you can configure this (see below).

This script uses [Apache ANT](http://ant.apache.org/) to build your JAR file:

- Install ANT `brew install ant`
- Generated an ANT build file (`meeshquest.xml`). In IntelliJ, `Build -> Generate ANT Build...`. Make sure that "Use current IDEA instance for idea.home property" is checked. You'll need to re-run this if you change your project dependencies.

You may need to add a line to the build file to identify the main class. (There's probably a better way to do this)
```xml
<!-- meeshquest.xml -->
<jar ...>
  <manifest>
    <attribute name="Main-Class" value="cmsc420.meeshquest.part2.MeeshQuest"/>
  </manifest>
<jar />
```

You'll need [node](https://nodejs.org/en/) and [yarn](https://yarnpkg.com/) installed, then install project dependencies:

```bash
$ yarn install
```

Your directory should be structured roughly like so:

```
.
├── meeshquest.xml
├── out
│   ├── artifacts
│   │   └── MeeshQuest
│   │       └── meeshquest.jar
│   ├── ...
├── canonical-cli
│   ├── Gulpfile.js
│   ├── ...
├── src
│   ├── cmsc420
│   ├── ...
├── tests
│   ├── input
│   │   ├── part1.public.sometest.input.xml
│   │   ├── ...
│   ├── input-scraped
│   ├── output
├── ...

```

# Usage

### Canonical Diff
Diffs your output with the canonical's output. This task will build your JAR, scrape any needed inputs from the canonical, run your project on the selected input and then produce a diff.

```bash
$ gulp diff
$ gulp diff -f part2.public.pm3insert.input.xml
```

### Scrape Outputs
Runs all modified inputs and writes the canonical output to the output directory.

```bash
$ gulp scrape
```

> This caches output files based on the access time, so you won't need to worry about unnecessary requests.

### Build JAR
Builds your JAR file. Handy for submission, but also used in other commands.
```bash
$ gulp build
```

### Run Tests
Generates the output by running your JAR file on inputs. Defaults to all inputs in the `tests/input` directory, but can run a specific file with the `-f` flag. Output is placed in `tests/my-output`.
```bash
$ gulp run
$ gulp run -f part2.public.pm3insert.input.xml
```

# Configuration

Modify the configuration in `Gulpfile.js`.
```javascript
/* CONFIGURATION */
const MEESHQUEST_PART = 2
const ROOT_DIR = '../'
// Relative to ROOT_DIR:
const TEST_DIR = 'tests/'
const JAR_FILE = 'out/artifacts/MeeshQuest/meeshquest.jar'
const ANT_BUILD_FILE = 'meeshquest.xml'
const DIFF_CMD = 'colordiff' // or just the usual 'diff'
/* END CONFIGURATION */
```

Store input files in `TEST_DIR/input`. The canonical output will be written to `TEST_DIR/output` under the same name as each input file. Input files will be copied into `TEST_DIR/input-scraped` to avoid running the same input multiple times.
