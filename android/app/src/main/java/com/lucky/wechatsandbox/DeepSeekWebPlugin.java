package com.lucky.wechatsandbox;

import android.app.Dialog;
import android.content.Context;
import android.content.pm.ApplicationInfo;
import android.graphics.Color;
import android.graphics.drawable.ColorDrawable;
import android.os.Handler;
import android.os.Looper;
import android.view.Gravity;
import android.view.KeyEvent;
import android.view.MotionEvent;
import android.view.ViewGroup;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.CookieManager;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.TextView;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * DeepSeek 网页端桥接（Android WebView 版）。
 *
 * 插件只做四件事：准备一个隐藏 WebView、提供登录窗口、执行页面 JS、报告当前地址。
 * 真正的输入/发送/等回复/会话复用逻辑在前端 src/lib/deepseekWebNative.ts。
 *
 * 用完整浏览器 UA（不带 "wv"），避免站点把 WebView 当成受限环境。
 */
@CapacitorPlugin(name = "DeepSeekWeb")
public class DeepSeekWebPlugin extends Plugin {

    private static final String CHAT_URL = "https://chat.deepseek.com/";
    private static final String UA =
            "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 " +
            "(KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36";

    private final Handler handler = new Handler(Looper.getMainLooper());

    private WebView webView;
    private WebView loginWebView;
    private Dialog loginDialog;
    private boolean pageReady = false;
    private String lastUrl = "";
    private PluginCall pendingLoad;

    private void runOnUi(Runnable action) {
        if (Looper.myLooper() == Looper.getMainLooper()) action.run();
        else handler.post(action);
    }

    private Context context() {
        return getActivity() != null ? getActivity() : getContext();
    }

    private int dp(int value) {
        return Math.round(value * context().getResources().getDisplayMetrics().density);
    }

    private WebView buildWebView(WebViewClient client) {
        WebView view = new WebView(context());
        WebSettings settings = view.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setUserAgentString(UA);
        settings.setMediaPlaybackRequiresUserGesture(true);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setSupportMultipleWindows(false);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setJavaScriptCanOpenWindowsAutomatically(false);
        // 隐藏 WebView 不参与焦点，避免程序输入时弹出系统键盘
        view.setFocusable(false);
        view.setFocusableInTouchMode(false);
        view.setBackgroundColor(Color.BLACK);
        view.setWebChromeClient(new WebChromeClient());
        view.setWebViewClient(client);
        CookieManager.getInstance().setAcceptCookie(true);
        CookieManager.getInstance().setAcceptThirdPartyCookies(view, true);
        if ((context().getApplicationInfo().flags & ApplicationInfo.FLAG_DEBUGGABLE) != 0) {
            WebView.setWebContentsDebuggingEnabled(true);
        }
        return view;
    }

    private void ensureHiddenWebView() {
        if (webView != null) return;
        if (getActivity() == null) return;
        webView = buildWebView(new WebViewClient() {
            @Override
            public void onPageStarted(WebView view, String url, android.graphics.Bitmap favicon) {
                lastUrl = url != null ? url : "";
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                lastUrl = url != null ? url : "";
                pageReady = true;
                CookieManager.getInstance().flush();
                if (pendingLoad != null) {
                    PluginCall call = pendingLoad;
                    pendingLoad = null;
                    JSObject ret = new JSObject();
                    ret.put("url", lastUrl);
                    call.resolve(ret);
                }
            }
        });

        ViewGroup root = getActivity().findViewById(android.R.id.content);
        // 放到 Capacitor 主 WebView 后面：占满尺寸保证页面按手机宽度排版，但用户看不见
        FrameLayout.LayoutParams params = new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
        );
        // 程序自己会 focus 输入框，关掉软键盘，避免一点就弹输入法
        webView.getSettings().setShowSoftInputOnFocus(false);
        root.addView(webView, 0, params);
    }

    @PluginMethod
    public void status(PluginCall call) {
        runOnUi(() -> {
            JSObject ret = new JSObject();
            boolean running = webView != null;
            ret.put("running", running);
            ret.put("url", lastUrl);
            if (!running || !pageReady) {
                ret.put("loggedIn", false);
                call.resolve(ret);
                return;
            }
            webView.evaluateJavascript(
                    "(function(){return !!(document.querySelector('textarea')||document.querySelector('[contenteditable=\"true\"]'));})()",
                    value -> {
                        boolean loggedIn = "true".equals(value) && !lastUrl.contains("sign_in");
                        ret.put("loggedIn", loggedIn);
                        call.resolve(ret);
                    }
            );
        });
    }

    @PluginMethod
    public void loadUrl(PluginCall call) {
        final String url = call.getString("url", CHAT_URL);
        runOnUi(() -> {
            if (getActivity() == null) {
                call.reject("应用不在前台");
                return;
            }
            ensureHiddenWebView();
            if (webView == null) {
                call.reject("无法创建内置浏览器");
                return;
            }
            if (pendingLoad != null) {
                PluginCall previous = pendingLoad;
                pendingLoad = null;
                JSObject ret = new JSObject();
                ret.put("url", lastUrl);
                previous.resolve(ret);
            }
            pendingLoad = call;
            pageReady = false;
            webView.loadUrl(url);
            handler.postDelayed(() -> {
                if (pendingLoad == call) {
                    pendingLoad = null;
                    JSObject ret = new JSObject();
                    ret.put("url", lastUrl);
                    call.resolve(ret);
                }
            }, 30000);
        });
    }

    @PluginMethod
    public void evalPage(PluginCall call) {
        final String script = call.getString("script");
        if (script == null) {
            call.reject("缺少要执行的脚本");
            return;
        }
        runOnUi(() -> {
            if (webView == null || !pageReady) {
                call.reject("网页还没加载完成");
                return;
            }
            webView.evaluateJavascript(script, value -> {
                JSObject ret = new JSObject();
                ret.put("value", value);
                call.resolve(ret);
            });
        });
    }

    /**
     * 注入的 KeyboardEvent 是 isTrusted:false，站点可以直接忽略。
     * 这里走 View 层的按键分发，页面拿到的是真实回车。
     */
    @PluginMethod
    public void pressEnter(PluginCall call) {
        runOnUi(() -> {
            if (webView == null) {
                call.reject("内置浏览器还没打开");
                return;
            }
            webView.requestFocus();
            long now = android.os.SystemClock.uptimeMillis();
            KeyEvent down = new KeyEvent(now, now, KeyEvent.ACTION_DOWN, KeyEvent.KEYCODE_ENTER, 0);
            KeyEvent up = new KeyEvent(now, now + 40, KeyEvent.ACTION_UP, KeyEvent.KEYCODE_ENTER, 0);
            boolean handled = webView.dispatchKeyEvent(down);
            webView.dispatchKeyEvent(up);
            JSObject ret = new JSObject();
            ret.put("handled", handled);
            call.resolve(ret);
        });
    }

    /** 同上：用 MotionEvent 点页面坐标，站点无法区分于手指。坐标是页面 CSS px。 */
    @PluginMethod
    public void tapAt(PluginCall call) {
        double cssX = call.getDouble("x", 0d);
        double cssY = call.getDouble("y", 0d);
        runOnUi(() -> {
            if (webView == null) {
                call.reject("内置浏览器还没打开");
                return;
            }
            float density = context().getResources().getDisplayMetrics().density;
            float px = (float) (cssX * density);
            float py = (float) (cssY * density);
            long now = android.os.SystemClock.uptimeMillis();
            MotionEvent down = MotionEvent.obtain(now, now, MotionEvent.ACTION_DOWN, px, py, 0);
            MotionEvent up = MotionEvent.obtain(now, now + 60, MotionEvent.ACTION_UP, px, py, 0);
            webView.dispatchTouchEvent(down);
            webView.dispatchTouchEvent(up);
            down.recycle();
            up.recycle();
            JSObject ret = new JSObject();
            ret.put("x", px);
            ret.put("y", py);
            call.resolve(ret);
        });
    }

    @PluginMethod
    public void currentUrl(PluginCall call) {
        runOnUi(() -> {
            JSObject ret = new JSObject();
            String url = webView != null ? webView.getUrl() : lastUrl;
            ret.put("url", url != null ? url : "");
            call.resolve(ret);
        });
    }
    @PluginMethod
    public void reload(PluginCall call) {
        runOnUi(() -> {
            pageReady = false;
            if (webView != null) webView.reload();
            call.resolve();
        });
    }

    @PluginMethod
    public void openLogin(PluginCall call) {
        runOnUi(() -> {
            if (getActivity() == null) {
                call.reject("应用不在前台");
                return;
            }
            if (loginDialog != null && loginDialog.isShowing()) {
                loginDialog.dismiss();
            }

            final boolean[] resolved = { false };
            final Dialog dialog = new Dialog(context(), android.R.style.Theme_Material_NoActionBar);
            dialog.requestWindowFeature(Window.FEATURE_NO_TITLE);

            LinearLayout root = new LinearLayout(context());
            root.setOrientation(LinearLayout.VERTICAL);
            root.setBackgroundColor(Color.parseColor("#111111"));

            LinearLayout bar = new LinearLayout(context());
            bar.setOrientation(LinearLayout.HORIZONTAL);
            bar.setGravity(Gravity.CENTER_VERTICAL);
            bar.setPadding(dp(16), dp(10), dp(10), dp(10));
            bar.setBackgroundColor(Color.parseColor("#191919"));

            TextView title = new TextView(context());
            title.setText("登录 DeepSeek");
            title.setTextColor(Color.parseColor("#e6e6e6"));
            title.setTextSize(17);
            bar.addView(title, new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f));

            Button done = new Button(context());
            done.setText("完成");
            done.setAllCaps(false);
            done.setTextColor(Color.parseColor("#58be6a"));
            done.setBackgroundColor(Color.TRANSPARENT);
            done.setOnClickListener(v -> {
                if (resolved[0]) return;
                resolved[0] = true;
                String url = loginWebView != null ? loginWebView.getUrl() : "";
                dialog.dismiss();
                JSObject ret = new JSObject();
                ret.put("loggedIn", url != null && !url.contains("sign_in"));
                call.resolve(ret);
            });
            bar.addView(done, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, dp(40)));
            root.addView(bar, new LinearLayout.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT));

            loginWebView = buildWebView(new WebViewClient() {
                @Override
                public void onPageFinished(WebView view, String url) {
                    CookieManager.getInstance().flush();
                }
            });
            loginWebView.setFocusable(true);
            loginWebView.setFocusableInTouchMode(true);
            root.addView(loginWebView, new LinearLayout.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT, 0, 1f));
            loginWebView.loadUrl(CHAT_URL);

            dialog.setContentView(root);
            dialog.setOnDismissListener(d -> {
                if (!resolved[0]) {
                    resolved[0] = true;
                    String url = loginWebView != null ? loginWebView.getUrl() : "";
                    try {
                        JSObject ret = new JSObject();
                        ret.put("loggedIn", url != null && !url.contains("sign_in"));
                        call.resolve(ret);
                    } catch (Exception ignored) {
                        // 页面已经销毁时忽略
                    }
                }
                if (loginWebView != null) {
                    ViewGroup parent = (ViewGroup) loginWebView.getParent();
                    if (parent != null) parent.removeView(loginWebView);
                    loginWebView.destroy();
                    loginWebView = null;
                }
                CookieManager.getInstance().flush();
                loginDialog = null;
                // 登录窗口关闭后，后台页面重新加载一次，带上新的登录状态
                if (webView != null) {
                    pageReady = false;
                    handler.postDelayed(() -> {
                        if (webView != null) webView.reload();
                    }, 500);
                }
            });
            dialog.show();

            Window window = dialog.getWindow();
            if (window != null) {
                window.setBackgroundDrawable(new ColorDrawable(Color.parseColor("#111111")));
                window.setLayout(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT);
                window.setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE);
            }
            loginDialog = dialog;
        });
    }

    @Override
    protected void handleOnPause() {
        CookieManager.getInstance().flush();
        super.handleOnPause();
    }

    @Override
    protected void handleOnDestroy() {
        if (loginDialog != null) {
            loginDialog.dismiss();
            loginDialog = null;
        }
        if (loginWebView != null) {
            loginWebView.destroy();
            loginWebView = null;
        }
        if (webView != null) {
            ViewGroup parent = (ViewGroup) webView.getParent();
            if (parent != null) parent.removeView(webView);
            webView.destroy();
            webView = null;
        }
        pageReady = false;
        super.handleOnDestroy();
    }
}
