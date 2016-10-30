# canonical-cli
Submits XML inputs to the [CMSC420 ACL](https://cmsc420.cs.umd.edu/meeshquest/part2/input/) and saves the output to your file system.

# Usage

Runs all modified inputs and writes the canonical output to the output directory.
```bash
$ gulp
```

# Configuration

Modify the configuration in `Gulpfile.js`.
```javascript
/* CONFIGURATION */
// Change this if you use a different location for your test inputs/outputs
const TEST_DIR = '../tests/'
// Change if you want to test a different part of the project
const PART = 2
/* END CONFIGURATION */
```

Store input files in `TEST_DIR/input`. The canonical output will be written to `TEST_DIR/output` under the same name as each input file. Input files will be copied into `TEST_DIR/input-scraped` to avoid running the same input multiple times.
