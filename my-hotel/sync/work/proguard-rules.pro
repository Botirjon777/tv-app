# Add project specific ProGuard rules here.
# You can control the set of applied configuration files using the
# proguardFiles setting in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# If your project uses WebView with JS, uncomment the following
# and specify the fully qualified class name to the JavaScript interface
# class:
#-keepclassmembers class fqcn.of.javascript.interface.for.webview {
#   public *;
#}

# Uncomment this to preserve the line number information for
# debugging stack traces.
#-keepattributes SourceFile,LineNumberTable

# If you keep the line number information, uncomment this to
# hide the original source file name.
#-renamesourcefileattribute SourceFile

# Keep Hilt Worker classes
-keep class * extends androidx.work.CoroutineWorker
-keep class * extends androidx.work.ListenableWorker

# Keep Hilt Worker Factory
-keep class androidx.hilt.work.HiltWorkerFactory { *; }

# Keep worker class names for reflection
-keep class com.karuhun.sync.worker.SyncWorker { *; }

# Keep Hilt generated classes
-keep class **_Factory { *; }
-keep class **_MembersInjector { *; }

# Keep Dagger/Hilt generated entry points
-keep interface **EntryPoint { *; }

# Keep worker parameters and constructors
-keepclassmembers class * extends androidx.work.CoroutineWorker {
    public <init>(android.content.Context, androidx.work.WorkerParameters);
}

# Keep AssistedInject constructors
-keepclassmembers class * {
    @dagger.assisted.AssistedInject <init>(...);
}

# Keep class names for worker class name resolution
-keepnames class * extends androidx.work.CoroutineWorker
