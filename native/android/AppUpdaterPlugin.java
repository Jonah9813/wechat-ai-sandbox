package com.lucky.wechatsandbox;

import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;

import androidx.core.content.FileProvider;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * 自动更新用的原生下载器：
 * GitHub Release 的 APK 下载到 cache/updates，然后用系统安装器覆盖安装。
 * 必须和旧版本使用同一个签名，否则系统会拒绝安装。
 */
@CapacitorPlugin(name = "AppUpdater")
public class AppUpdaterPlugin extends Plugin {

    private final ExecutorService executor = Executors.newSingleThreadExecutor();

    private boolean canInstallPackages() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return true;
        return getContext().getPackageManager().canRequestPackageInstalls();
    }

    @PluginMethod
    public void canInstall(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("granted", canInstallPackages());
        call.resolve(ret);
    }

    @PluginMethod
    public void downloadAndInstall(PluginCall call) {
        final String url = call.getString("url");
        final String fileName = call.getString("fileName", "update.apk");
        if (url == null || url.isEmpty()) {
            call.reject("下载地址为空");
            return;
        }
        if (!canInstallPackages()) {
            openUnknownSourcesSettings();
            call.reject("请允许「安装未知应用」后重试");
            return;
        }

        final File dir = new File(getContext().getCacheDir(), "updates");
        if (!dir.exists() && !dir.mkdirs()) {
            call.reject("无法创建下载目录");
            return;
        }
        final File target = new File(dir, sanitize(fileName));

        executor.execute(() -> {
            HttpURLConnection connection = null;
            try {
                URL current = new URL(url);
                for (int i = 0; i < 6; i++) {
                    connection = (HttpURLConnection) current.openConnection();
                    connection.setInstanceFollowRedirects(false);
                    connection.setConnectTimeout(20000);
                    connection.setReadTimeout(120000);
                    connection.setRequestProperty("User-Agent", "WeChatSandbox-Updater");
                    connection.setRequestProperty("Accept", "application/octet-stream");
                    connection.connect();
                    int code = connection.getResponseCode();
                    if (code >= 300 && code < 400) {
                        String location = connection.getHeaderField("Location");
                        if (location == null || location.isEmpty()) break;
                        current = new URL(current, location);
                        connection.disconnect();
                        connection = null;
                        continue;
                    }
                    break;
                }
                if (connection == null) throw new Exception("网络连接失败");
                int status = connection.getResponseCode();
                if (status < 200 || status >= 300) {
                    throw new Exception("下载失败（HTTP " + status + "）");
                }

                final int total = connection.getContentLength();
                long downloaded = 0;
                int lastPercent = -1;
                byte[] buffer = new byte[64 * 1024];
                try (InputStream in = connection.getInputStream();
                     FileOutputStream out = new FileOutputStream(target)) {
                    int read;
                    while ((read = in.read(buffer)) != -1) {
                        out.write(buffer, 0, read);
                        downloaded += read;
                        if (total > 0) {
                            int percent = (int) Math.min(100, downloaded * 100 / total);
                            if (percent != lastPercent) {
                                lastPercent = percent;
                                JSObject progress = new JSObject();
                                progress.put("percent", percent);
                                progress.put("downloaded", downloaded);
                                progress.put("total", total);
                                notifyListeners("progress", progress);
                            }
                        }
                    }
                }

                if (target.length() < 1024) throw new Exception("安装包不完整");
                if (total > 0 && target.length() < total * 0.98) {
                    throw new Exception("安装包下载不完整，请重试");
                }

                installApk(target);

                JSObject ret = new JSObject();
                ret.put("started", true);
                call.resolve(ret);
            } catch (Exception error) {
                String message = error.getMessage();
                call.reject(message != null ? message : "下载安装包失败");
            } finally {
                if (connection != null) connection.disconnect();
            }
        });
    }

    private void installApk(File file) {
        final Uri uri = FileProvider.getUriForFile(
                getContext(),
                getContext().getPackageName() + ".fileprovider",
                file
        );
        final Intent intent = new Intent(Intent.ACTION_VIEW);
        intent.setDataAndType(uri, "application/vnd.android.package-archive");
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_GRANT_READ_URI_PERMISSION);
        if (getActivity() != null) {
            getActivity().runOnUiThread(() -> getContext().startActivity(intent));
        } else {
            getContext().startActivity(intent);
        }
    }

    private void openUnknownSourcesSettings() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        try {
            Intent intent = new Intent(
                    Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,
                    Uri.parse("package:" + getContext().getPackageName())
            );
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(intent);
        } catch (Exception ignored) {
            // 少数系统没有这个页面，用户需要去系统设置里手动允许
        }
    }

    private String sanitize(String name) {
        String safe = name == null ? "update.apk" : name.replaceAll("[^A-Za-z0-9._-]", "_");
        if (!safe.toLowerCase().endsWith(".apk")) safe += ".apk";
        return safe;
    }
}
