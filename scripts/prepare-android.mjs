/**
 * 在 `npx cap add android` 之后，一次性完成手机工程的原生改动：
 *  - 拷入 DeepSeekWeb / AppUpdater 插件和 MainActivity
 *  - 加安装 APK 权限、FileProvider、竖屏、键盘 adjustResize
 *  - 让 Gradle 从环境变量读版本号和签名
 *
 * 用法：node scripts/prepare-android.mjs
 * 可重复运行；第一次会留 .bak 备份。
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const android = path.join(root, 'android')
const app = path.join(android, 'app')
const main = path.join(app, 'src', 'main')
const javaDir = path.join(main, 'java', 'com', 'lucky', 'wechatsandbox')
const resDir = path.join(main, 'res')
const srcDir = path.join(root, 'native', 'android')

function fail(message) {
  console.error(`\n[失败] ${message}\n`)
  process.exit(1)
}

function read(file) {
  return fs.readFileSync(file, 'utf8')
}

function write(file, content) {
  fs.mkdirSync(path.dirname(file), { recursive: true })
  if (fs.existsSync(file) && !fs.existsSync(`${file}.bak`)) {
    fs.copyFileSync(file, `${file}.bak`)
  }
  fs.writeFileSync(file, content, 'utf8')
}

if (!fs.existsSync(app)) {
  fail('找不到 android/app。请先运行 npx cap add android。')
}
if (!fs.existsSync(path.join(srcDir, 'DeepSeekWebPlugin.java'))) {
  fail('找不到 native/android 插件源码。')
}

// 1. 原生代码
for (const name of ['DeepSeekWebPlugin.java', 'AppUpdaterPlugin.java', 'MainActivity.java']) {
  fs.mkdirSync(javaDir, { recursive: true })
  fs.copyFileSync(path.join(srcDir, name), path.join(javaDir, name))
  console.log(`已写入 ${path.relative(root, path.join(javaDir, name))}`)
}
fs.mkdirSync(path.join(resDir, 'xml'), { recursive: true })
fs.copyFileSync(path.join(srcDir, 'updater_paths.xml'), path.join(resDir, 'xml', 'updater_paths.xml'))
console.log('已写入 android/app/src/main/res/xml/updater_paths.xml')

// 2. AndroidManifest
const manifestFile = path.join(main, 'AndroidManifest.xml')
let manifest = read(manifestFile)

if (!manifest.includes('REQUEST_INSTALL_PACKAGES')) {
  manifest = manifest.replace(
    /(<manifest[^>]*>)/,
    '$1\n\n    <!-- 自动更新：允许调起系统安装器 -->\n    <uses-permission android:name="android.permission.REQUEST_INSTALL_PACKAGES" />',
  )
  console.log('已加 REQUEST_INSTALL_PACKAGES 权限')
}

if (!manifest.includes('.updater')) {
  const provider = `
        <!-- 自动更新：把下载到 cache/updates 的 APK 交给系统安装器 -->
        <provider
            android:name="androidx.core.content.FileProvider"
            android:authorities="\${applicationId}.updater"
            android:exported="false"
            android:grantUriPermissions="true">
            <meta-data
                android:name="android.support.FILE_PROVIDER_PATHS"
                android:resource="@xml/updater_paths" />
        </provider>
`
  manifest = manifest.replace(/(\s*)<\/application>/, `${provider}$1</application>`)
  console.log('已加 FileProvider')
}

manifest = manifest.replace(/<activity[\s\S]*?android:name="\.MainActivity"[\s\S]*?>/, (tag) => {
  let next = tag
  if (!next.includes('android:screenOrientation')) {
    next = next.replace(/\s*>$/, '\n            android:screenOrientation="portrait">')
  }
  if (!next.includes('android:windowSoftInputMode')) {
    next = next.replace(/\s*>$/, '\n            android:windowSoftInputMode="adjustResize">')
  }
  return next
})

write(manifestFile, manifest)

// 3. app/build.gradle
const groovy = path.join(app, 'build.gradle')
const kts = path.join(app, 'build.gradle.kts')
if (!fs.existsSync(groovy)) {
  if (fs.existsSync(kts)) {
    fail('检测到 Kotlin DSL（build.gradle.kts），这个脚本只写了 Groovy 版本，请让 AI 手动改。')
  }
  fail('找不到 android/app/build.gradle。')
}

let gradle = read(groovy)

if (!gradle.includes('APP_VERSION_CODE')) {
  if (/versionCode\s+1\b/.test(gradle)) {
    gradle = gradle.replace(
      /versionCode\s+1\b/,
      'versionCode (System.getenv("APP_VERSION_CODE") ?: "1").toInteger()',
    )
  } else {
    console.warn('[注意] 没找到 versionCode 1，请手动把 versionCode 改成读 APP_VERSION_CODE')
  }
  if (/versionName\s+"1\.0"/.test(gradle)) {
    gradle = gradle.replace(
      /versionName\s+"1\.0"/,
      'versionName (System.getenv("APP_VERSION_NAME") ?: "0.1.0")',
    )
  } else {
    console.warn('[注意] 没找到 versionName "1.0"，请手动把 versionName 改成读 APP_VERSION_NAME')
  }
  console.log('已让 Gradle 从环境变量读版本号')
}

if (!gradle.includes('signingConfigs')) {
  const signing = `
    signingConfigs {
        release {
            if (System.getenv("KEYSTORE_FILE") != null) {
                storeFile file(System.getenv("KEYSTORE_FILE"))
                storePassword System.getenv("ANDROID_KEYSTORE_PASSWORD")
                keyAlias System.getenv("ANDROID_KEY_ALIAS")
                keyPassword System.getenv("ANDROID_KEY_PASSWORD")
                storeType "PKCS12"
            }
        }
    }
`
  const index = gradle.indexOf('buildTypes {')
  if (index < 0) fail('build.gradle 里找不到 buildTypes，无法加签名配置。')
  gradle = gradle.slice(0, index) + signing + '\n' + gradle.slice(index)
  console.log('已加 signingConfigs')
}

if (!gradle.includes('compileOptions')) {
  const buildTypesIndex = gradle.indexOf('buildTypes {')
  if (buildTypesIndex < 0) fail('build.gradle 里找不到 buildTypes，无法加 Java 版本配置。')
  const javaOptions = `
    compileOptions {
        sourceCompatibility JavaVersion.VERSION_17
        targetCompatibility JavaVersion.VERSION_17
    }

`
  gradle = gradle.slice(0, buildTypesIndex) + javaOptions + gradle.slice(buildTypesIndex)
  console.log('已设置 Java 17 编译选项')
}

const buildTypesAt = gradle.indexOf('buildTypes {')
const releaseAt = gradle.indexOf('release {', buildTypesAt)
if (releaseAt >= 0) {
  const chunk = gradle.slice(releaseAt, releaseAt + 400)
  if (!chunk.includes('signingConfig')) {
    const insert = `
            if (System.getenv("KEYSTORE_FILE") != null) {
                signingConfig signingConfigs.release
            }`
    gradle = gradle.slice(0, releaseAt + 'release {'.length) + insert + gradle.slice(releaseAt + 'release {'.length)
    console.log('已让 release 使用签名配置')
  }
} else {
  console.warn('[注意] 没找到 release buildType，请手动加 signingConfig signingConfigs.release')
}

write(groovy, gradle)

console.log('\n[完成] Android 工程已准备好。')
console.log('下一步：python scripts/make_launcher_icons.py && npx cap sync android')
