package com.example.webviewer;

import androidx.appcompat.app.AppCompatActivity;

import android.annotation.SuppressLint;
import android.content.Intent;
import android.content.pm.ActivityInfo;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;

public class MainActivity extends AppCompatActivity
{
    WebView webView;
    @Override
    protected void onCreate(Bundle savedInstanceState)
    {
        super.onCreate(savedInstanceState);
        View decorView = getWindow().getDecorView();

        int uiOptions = View.SYSTEM_UI_FLAG_LAYOUT_STABLE |
                View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION |
                View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN |
                View.SYSTEM_UI_FLAG_HIDE_NAVIGATION |
                View.SYSTEM_UI_FLAG_FULLSCREEN |
                View.SYSTEM_UI_FLAG_IMMERSIVE;
        decorView.setSystemUiVisibility(uiOptions);

        setContentView(R.layout.activity_main);

        setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_PORTRAIT);

        webView = (WebView)findViewById(R.id.webView1);
        webView.setWebViewClient(new MyBrowser());
        webView.getSettings().setJavaScriptEnabled(true);

        webView.loadUrl("https://mgd-coursework.glitch.me");

        //webView.loadUrl("https://game-server-test.glitch.me");
        //webView.loadUrl("https://run-the-monsters-are-coming.glitch.me/");
    }
    private class MyBrowser extends WebViewClient
    {
        @Override
        public boolean shouldOverrideUrlLoading(WebView view, String url)
        {
            return url.equals("Navigation://OpenNativeScreen");
        }
    }
}