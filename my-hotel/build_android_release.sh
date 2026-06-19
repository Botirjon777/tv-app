#!/usr/bin/env bash

# IGNORE this file, it's only used in the internal Google release process

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
APP_OUT=$DIR/app/build/outputs

export JAVA_HOME="$(cd $DIR/../nowinandroid-prebuilts/jdk17/linux && pwd )"
echo "JAVA_HOME=$JAVA_HOME"

export ANDROID_HOME="$(cd $DIR/../../../prebuilts/fullsdk/linux && pwd )"
echo "ANDROID_HOME=$ANDROID_HOME"

echo "Copying google-services.json"
cp $DIR/../nowinandroid-prebuilts/google-services.json $DIR/app

echo "Copying local.properties"
cp $DIR/../nowinandroid-prebuilts/local.properties $DIR

cd $DIR

# Build the prodRelease variant
GRADLE_PARAMS=" --stacktrace -Puse-google-services"
$DIR/gradlew :app:clean :app:assembleProdRelease :app:bundleProdRelease ${GRADLE_PARAMS}
BUILD_RESULT=$?

# Prod release apk
cp $APP_OUT/apk/prod/release/app-prod-release.apk $DIST_DIR/app-prod-release.apk
# Prod release bundle
cp $APP_OUT/bundle/prodRelease/app-prod-release.aab $DIST_DIR/app-prod-release.aab
# Prod release bundle mapping
cp $APP_OUT/mapping/prodRelease/mapping.txt $DIST_DIR/mobile-release-aab-mapping.txt

exit $BUILD_RESULT
