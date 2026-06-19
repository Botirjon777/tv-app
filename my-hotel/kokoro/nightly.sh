#!/bin/bash

# Fail on any error.
set -e
# Display commands to stderr.
set -x

# Run the normal build, but replace the default virtual devices with physical ones.
# walleye     | Pixel 2       | API 27 | Phone
# gts4lltevzw | Galaxy Tab S4 | API 28 | Tablet
# a10         | Samsung A10   | API 29 | Phone
# redfin      | Pixel 5e      | API 30 | Phone
# oriole      | Pixel 6       | API 31 | Phone
bash $KOKORO_ARTIFACTS_DIR/git/nowinandroid/kokoro/build.sh "walleye,gts4lltevzw,a10,redfin,oriole" "27,28,29,30,31"

exit $?
