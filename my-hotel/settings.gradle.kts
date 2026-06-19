pluginManagement {
    includeBuild("build-logic")
    repositories {
        google {
            content {
                includeGroupByRegex("com\\.android.*")
                includeGroupByRegex("com\\.google.*")
                includeGroupByRegex("androidx.*")
            }
        }
        mavenCentral()
        gradlePluginPortal()
    }
}

dependencyResolutionManagement {
    repositoriesMode = RepositoriesMode.FAIL_ON_PROJECT_REPOS
    repositories {
        google {
            content {
                includeGroupByRegex("com\\.android.*")
                includeGroupByRegex("com\\.google.*")
                includeGroupByRegex("androidx.*")
            }
        }
        mavenCentral()
    }
}
rootProject.name = "LauncherCompose"

enableFeaturePreview("TYPESAFE_PROJECT_ACCESSORS")
include(":app")
include(":core:designsystem")
include(":lint")

check(JavaVersion.current().isCompatibleWith(JavaVersion.VERSION_17)) {
    """
    Now in Android requires JDK 17+ but it is currently using JDK ${JavaVersion.current()}.
    Java Home: [${System.getProperty("java.home")}]
    https://developer.android.com/build/jdks#jdk-config-in-studio
    """.trimIndent()
}
include(":feature:home:ui")
include(":navigation")
include(":core:ui")
include(":feature:main-menu:ui")
include(":feature:content:ui")
include(":feature:screensaver:ui")
include(":core:network")
include(":core:common")
include(":feature:home:data")
include(":core:domain")
include(":sync:work")
include(":feature:hotel-profile:ui")
include(":feature:hotel-profile:data")
include(":core:database")
include(":core:model")
include(":feature:main-menu:data")
include(":feature:content:data")
include(":feature:restaurant:ui")
include(":feature:restaurant:data")
include(":core:datastore")
include(":core:data")
include(":core:datastore-proto")
include(":feature:weather:data")
include(":feature:onboarding:presentation")
