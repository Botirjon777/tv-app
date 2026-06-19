plugins {
    alias(libs.plugins.nowinandroid.android.library)
    alias(libs.plugins.nowinandroid.android.library.jacoco)
    alias(libs.plugins.nowinandroid.hilt)
}

android {
    namespace = "com.karuhun.sync"
}

dependencies {
    ksp(libs.hilt.ext.compiler)

    implementation(projects.core.domain)
    implementation(projects.feature.hotelProfile.data)
    implementation(projects.feature.content.data)
    implementation(projects.feature.restaurant.data)

    implementation(libs.androidx.tracing.ktx)
    implementation(libs.androidx.work.ktx)
    implementation(libs.hilt.ext.work)
}