// ==UserScript==
// @name          贴吧小助手
// @namespace     https://github.com/maomao1996/tampermonkey-scripts
// @version       0.4.1
// @description   自动顶贴回复、移除贴吧列表和帖子内部广告、移除碍眼模块
// @icon          https://tb1.bdstatic.com/tb/favicon.ico
// @author        maomao1996
// @include       *://tieba.baidu.com/p/*
// @include       *://tieba.baidu.com/f*
// @grant         GM_notification
// @grant         GM_addStyle
// ==/UserScript==
;
(function () {
    'use strict';
    // 顶贴模式选项
    var MODE_MAP = {
        CUSTOMIZE: '自定义模式',
        SENTENCE: '网络语句模式'
    };
    /**
     * 插件配置
     **/
    var CONFIG = {
        // 当前顶贴状态（为 true 时默认执行）
        STATUS: false,
        // 顶帖最小间隔（分钟）
        TIME_MIN: 1,
        // 顶帖最大间隔（分钟）
        TIME_MAX: 30,
        // 顶贴模式（自定义模式、网络语句模式）
        MODE: MODE_MAP.SENTENCE,
        // 自定义顶贴回复内容 仅在顶贴模式为 MODE_MAP.CUSTOMIZE 时可用
        TEXT: ['顶', '顶~'],
        // ===== 非配置项 =====
        // 定时器
        timer: null
    };
    /**
     * 工具方法 - 消息通知
     */
    var message = function (text) {
        GM_notification({ timeout: 2e3, text: text });
    };
    /**
     * 工具方法 - 随机函数
     * https://github.com/lodash/lodash/blob/master/random.js
     */
    var random = function (lower, upper, floating) {
        if (floating) {
            var rand = Math.random();
            var randLength = ("" + rand).length - 1;
            return Math.min(lower + rand * (upper - lower + parseFloat("1e-" + randLength)), upper);
        }
        return lower + Math.floor(Math.random() * (upper - lower + 1));
    };
    /**
     * 工具方法 - 移除元素
     */
    var removeHtmlElement = function (selector) {
        selector.each(function () {
            $(this).remove();
        });
    };
    /**
     * 移除碍眼模块
     */
    var moduleSelector = [
        // 顶部会员按钮
        '.u_member',
        // 右侧会员模块
        '.celebrity',
        // 右侧 app 下载
        '.app_download_box',
        // 悬浮栏 app 下载
        '.tbui_aside_fbar_button.tbui_fbar_down'
    ];
    GM_addStyle(moduleSelector.join(',') + '{display: none !important;}');
    /**
     * 顶帖模块
     **/
    var autoResponse = function () {
        // 插入控制按钮
        $('#quick_reply').after("<a id=\"ding_btn\" rel=\"noopener\" class=\"btn-sub btn-small\">" + (CONFIG.STATUS ? '关闭' : '开启') + "\u81EA\u52A8\u9876\u8D34\u56DE\u590D</a>");
        // 执行顶贴回复
        var runResponse = function () {
            if (!CONFIG.STATUS) {
                return;
            }
            var selectors = {
                // 输入框选择器
                editor: '#j_editor_for_container',
                // 提交按钮选择器
                submit: '.lzl_panel_submit.j_lzl_p_sb'
            };
            if (!$('#j_editor_for_container:visible').length) {
                var lzlPSelector = '.j_lzl_p.btn-sub.pull-right:visible';
                // 是否存在一条打开的回复
                if ($(lzlPSelector).length) {
                    $(lzlPSelector).eq(0).trigger('click');
                }
                // 是否打开楼中楼回复
                else if ($('a.lzl_link_unfold:visible').length) {
                    $('a.lzl_link_unfold:visible').eq(0).trigger('click');
                }
                // 打开回复楼主
                else {
                    $('#quick_reply').trigger('click');
                    selectors.editor = '#ueditor_replace';
                    selectors.submit = '.j_submit.poster_submit';
                }
            }
            // 提交回复
            var submit = function (text) {
                $(selectors.editor).text(text);
                $(selectors.submit).trigger('click');
                var time = random(CONFIG.TIME_MIN, CONFIG.TIME_MAX, true) * 6e4;
                console.log(time / 1e3 + "\u79D2\u540E\u81EA\u52A8\u9876\u8D34\u56DE\u590D");
                CONFIG.timer = setTimeout(function () {
                    runResponse();
                }, time);
            };
            // 语句模式
            if (CONFIG.MODE === MODE_MAP.SENTENCE) {
                // 调用一言 API 获取随机语句
                $.ajax({
                    type: 'GET',
                    url: 'https://v1.hitokoto.cn',
                    dataType: 'json',
                    success: function (data) {
                        submit(data.hitokoto);
                    },
                    error: function (_jqXHR, textStatus, errorThrown) {
                        console.error(textStatus, errorThrown);
                    }
                });
            }
            // 自定义模式
            else {
                var index = random(0, CONFIG.TEXT.length - 1);
                submit(CONFIG.TEXT[index]);
            }
        };
        // 默认是否执行
        if (CONFIG.STATUS) {
            setTimeout(function () {
                runResponse();
                message('已开启自动顶贴回复');
            }, 1e3);
        }
        // 顶贴控制函数
        $('#ding_btn').on('click', function () {
            if (CONFIG.STATUS) {
                // 关闭
                CONFIG.STATUS = false;
                clearTimeout(CONFIG.timer);
                CONFIG.timer = null;
                $(this).text('开启自动顶贴回复');
                message('已关闭自动顶贴回复');
            }
            else {
                // 开启
                CONFIG.STATUS = true;
                $(this).text('关闭自动顶贴回复');
                message('已开启自动顶贴回复');
                runResponse();
            }
        });
    };
    /**
     * 执行插件
     **/
    $(window).on('load', function () {
        var pathname = location.pathname;
        // 贴子详情
        if (/^\/p\/\d{1,}$/.test(pathname)) {
            console.log('进入贴子详情');
            // 自动顶贴回复
            autoResponse();
            // 移除帖子内部广告
            removeHtmlElement($('div[ad-dom-img="true"]'));
        }
        // 贴吧列表
        else if (pathname === '/f') {
            console.log('进入贴吧列表');
            // 移除贴吧列表广告
            removeHtmlElement($('#thread_list>li').not('.j_thread_list'));
            var adObserver = new MutationObserver(function (mutationsList) {
                mutationsList.forEach(function (mutation) {
                    if (mutation.type === 'childList' &&
                        $('li.clearfix .pull_right.label_text').length) {
                        removeHtmlElement($('#thread_list>li').not('.j_thread_list'));
                    }
                });
            });
            adObserver.observe($('body')[0], { childList: true });
        }
    });
})();
