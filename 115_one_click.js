// ==UserScript==
// @name         多格式链接一键复制工具
// @namespace    http://tampermonkey.net/
// @version      2.1
// @description  自动识别ed2k、磁力链接、115网盘链接，提供分类复制功能，适配安卓设备
// @author       You
// @match        *://*telegra.ph/*
// @match        *://*catbox.moe/*
// @grant        GM_setClipboard
// @grant        GM_notification
// @run-at       document-end
// @updateURL    https://raw.githubusercontent.com/chas0000/script/main/115_one_click.js
// @downloadURL  https://raw.githubusercontent.com/chas0000/script/main/115_one_click.js
// ==/UserScript==

(function() {
    'use strict';

    // 配置项
    const CONFIG = {
        buttonContainerStyle: `
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 9999;
            display: flex;
            flex-direction: column;
            gap: 10px;
            align-items: flex-end;
        `,
        buttonStyle: `
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 50px;
            padding: 12px 20px;
            font-size: 14px;
            font-weight: bold;
            cursor: pointer;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            transition: all 0.3s ease;
            min-width: 140px;
            touch-action: manipulation;
            -webkit-tap-highlight-color: transparent;
        `,
        buttonHoverStyle: `
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(0,0,0,0.3);
        `,
        indicatorStyle: `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9998;
            background: #4CAF50;
            color: white;
            padding: 10px 20px;
            border-radius: 25px;
            font-size: 14px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            display: none;
        `,
        linkTypes: {
            ed2k: { name: 'ed2k', icon: '🔗', color: '#667eea' },
            magnet: { name: 'magnet', icon: '🧲', color: '#f093fb' },
            pan115: { name: '115网盘', icon: '☁️', color: '#4facfe', action: 'open' }
        }
    };

    let foundLinks = {
        ed2k: [],
        magnet: [],
        pan115: []
    };
    let buttons = {};
    let buttonContainer = null;
    let indicator = null;

    // 初始化
    function init() {
        createUI();
        scanForEd2kLinks();
        setupMutationObserver();
    }

    // 创建UI元素
    function createUI() {
        // 创建按钮容器
        buttonContainer = document.createElement('div');
        buttonContainer.id = 'link-copy-container';
        buttonContainer.style.cssText = CONFIG.buttonContainerStyle;
        document.body.appendChild(buttonContainer);

        // 为每种链接类型创建按钮
        Object.keys(CONFIG.linkTypes).forEach(type => {
            const config = CONFIG.linkTypes[type];
            const button = document.createElement('button');
            button.id = `copy-button-${type}`;
            button.textContent = `${config.icon} 复制${config.name}`;
            button.style.cssText = CONFIG.buttonStyle;
            button.dataset.type = type;
            
            // 设置按钮颜色
            button.style.background = `linear-gradient(135deg, ${config.color} 0%, ${adjustColor(config.color, -20)} 100%)`;

            // 添加触摸和点击事件
            button.addEventListener('click', (e) => handleCopyClick(e, type));
            button.addEventListener('touchstart', function(e) {
                e.preventDefault();
                this.style.transform = 'scale(0.95)';
            });
            button.addEventListener('touchend', function(e) {
                e.preventDefault();
                this.style.transform = 'scale(1)';
                handleCopyClick(e, type);
            });

            // 鼠标悬停效果（仅桌面）
            if (!isMobileDevice()) {
                button.addEventListener('mouseenter', function() {
                    this.style.cssText = CONFIG.buttonStyle + CONFIG.buttonHoverStyle;
                    this.style.background = `linear-gradient(135deg, ${config.color} 0%, ${adjustColor(config.color, -20)} 100%)`;
                });
                button.addEventListener('mouseleave', function() {
                    this.style.cssText = CONFIG.buttonStyle;
                    this.style.background = `linear-gradient(135deg, ${config.color} 0%, ${adjustColor(config.color, -20)} 100%)`;
                });
            }

            buttonContainer.appendChild(button);
            buttons[type] = button;
        });

        // 创建提示指示器
        indicator = document.createElement('div');
        indicator.id = 'link-indicator';
        indicator.style.cssText = CONFIG.indicatorStyle;
        document.body.appendChild(indicator);
    }

    // 调整颜色亮度
    function adjustColor(color, amount) {
        return '#' + color.replace(/^#/, '').replace(/../g, color => ('0'+Math.min(255, Math.max(0, parseInt(color, 16) + amount)).toString(16)).substr(-2));
    }

    // 扫描页面中的各种链接
    function scanForEd2kLinks() {
        // 重置所有链接数组
        foundLinks = {
            ed2k: [],
            magnet: [],
            pan115: []
        };

        // 查找所有可能包含链接的元素
        const selectors = [
            '.ql-editor',
            'pre',
            'code',
            '.content',
            '.post-content',
            'article',
            '[contenteditable]',
            'p',
            'div'
        ];

        selectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
                const text = element.textContent || element.innerText;
                if (text) {
                    extractEd2kLinks(text);
                    extractMagnetLinks(text);
                    extractPan115Links(text);
                }
            });
        });

        // 额外扫描所有<a>标签的href属性
        const allLinks = document.querySelectorAll('a[href]');
        allLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href) {
                extractPan115Links(href);
                extractMagnetLinks(href);
                extractEd2kLinks(href);
            }
        });

        // 更新按钮显示状态
        updateButtons();
    }

    // 提取ed2k链接
    function extractEd2kLinks(text) {
        const ed2kRegex = /ed2k:\/\/\|file\|[^|]+\|[0-9]+\|[A-Fa-f0-9]{32}\|(?:[^|]+\|)*\//g;
        const matches = text.match(ed2kRegex);

        if (matches) {
            matches.forEach(link => {
                if (!foundLinks.ed2k.includes(link)) {
                    foundLinks.ed2k.push(link);
                }
            });
        }
    }

    // 提取磁力链接
    function extractMagnetLinks(text) {
        const magnetRegex = /magnet:\?xt=urn:btih:[a-zA-Z0-9]{40}/gi;
        const matches = text.match(magnetRegex);

        if (matches) {
            matches.forEach(link => {
                if (!foundLinks.magnet.includes(link)) {
                    foundLinks.magnet.push(link);
                }
            });
        }
    }

    // 提取115网盘链接
    function extractPan115Links(text) {
        // 匹配完整的115链接（包括带密码和不带密码的）
        const pan115Regex = /https?:\/\/(www\.)?(115cdn\.com|115\.com)\/s\/[a-zA-Z0-9]+(\?password=[a-zA-Z0-9]+)?/gi;
        const matches = text.match(pan115Regex);

        if (matches) {
            matches.forEach(link => {
                // 统一转换为115.com格式
                let normalizedLink = link.replace(/115cdn\.com/g, '115.com');
                // 去除可能的末尾标点符号
                normalizedLink = normalizedLink.replace(/[.,;!?"')\]]+$/, '');
                // 尝试多种拼接方式，使用 query 参数形式
                const oofLink = `oof.disk://openurl?url=${encodeURIComponent(normalizedLink)}`;
                if (!foundLinks.pan115.includes(oofLink)) {
                    foundLinks.pan115.push(oofLink);
                }
            });
        }
    }

    // 处理复制点击
    function handleCopyClick(e, type) {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        const links = foundLinks[type];
        if (!links || links.length === 0) {
            showNotification(`未找到${CONFIG.linkTypes[type].name}链接`, 'error');
            return;
        }

        const typeName = CONFIG.linkTypes[type].name;
        const action = CONFIG.linkTypes[type].action || 'copy';

        // 115网盘使用打开操作，其他类型使用复制操作
        if (type === 'pan115') {
            // 对于115网盘，尝试打开第一个链接
            const firstLink = links[0];
            
            // 显示确认对话框
            if (confirm(`即将打开115网盘链接：\n${firstLink}\n\n是否继续？`)) {
                openCustomProtocol(firstLink, typeName);
            }
        } else {
            // ed2k和磁力链接：复制链接并打开115离线下载页面
            const linksText = links.join('\n');
            
            // 先复制链接到剪贴板
            if (typeof GM_setClipboard !== 'undefined') {
                GM_setClipboard(linksText, 'text');
            } else {
                fallbackCopyToClipboardOnly(linksText);
            }
            
            // 然后打开115离线下载页面
            setTimeout(() => {
                open115OfflinePage();
            }, 300);
            
            showNotification(`已复制${links.length}个${typeName}链接\n正在打开115离线下载页面...`, 'success');
        }
    }

    // 仅复制链接（不显示通知）
    function fallbackCopyToClipboardOnly(text) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        try {
            document.execCommand('copy');
        } catch (err) {
            console.error('复制失败:', err);
        }

        document.body.removeChild(textArea);
    }

    // 打开115离线下载页面
    function open115OfflinePage() {
        const url = 'oof.disk://openurl/http://115.com/lx?taskdg=1';
        
        // 方法1：新窗口打开
        window.open(url, '_blank');
        
        // 方法2：如果新窗口被阻止，尝试直接跳转
        setTimeout(() => {
            window.location.href = url;
        }, 1000);
    }

    // 打开自定义协议链接
    function openCustomProtocol(url, typeName) {
        showNotification(`正在打开${typeName}...`, 'info');
        
        // 方法1：直接通过window.location跳转（最可靠）
        try {
            window.location.href = url;
        } catch (e) {
            console.error('直接跳转失败:', e);
        }
        
        // 方法2：延迟使用iframe作为备用
        setTimeout(() => {
            try {
                const iframe = document.createElement('iframe');
                iframe.style.display = 'none';
                iframe.src = url;
                document.body.appendChild(iframe);
                
                // 清理iframe
                setTimeout(() => {
                    if (iframe.parentNode) {
                        document.body.removeChild(iframe);
                    }
                }, 2000);
            } catch (e) {
                console.error('iframe跳转失败:', e);
            }
        }, 300);
        
        // 方法3：创建隐藏的<a>标签并触发点击
        setTimeout(() => {
            try {
                const link = document.createElement('a');
                link.href = url;
                link.style.display = 'none';
                document.body.appendChild(link);
                link.click();
                
                // 清理link
                setTimeout(() => {
                    if (link.parentNode) {
                        document.body.removeChild(link);
                    }
                }, 2000);
            } catch (e) {
                console.error('link点击失败:', e);
            }
        }, 600);
    }

    // 降级复制方案
    function fallbackCopyToClipboard(text, typeName) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        try {
            const successful = document.execCommand('copy');
            if (successful) {
                const count = text.split('\n').length;
                showNotification(`成功复制 ${count} 个${typeName}链接`, 'success');
            } else {
                showNotification('复制失败，请手动复制', 'error');
            }
        } catch (err) {
            showNotification('复制失败: ' + err, 'error');
        }

        document.body.removeChild(textArea);
    }

    // 更新按钮显示状态
    function updateButtons() {
        let totalFound = 0;
        
        Object.keys(foundLinks).forEach(type => {
            const count = foundLinks[type].length;
            totalFound += count;
            
            if (buttons[type]) {
                const config = CONFIG.linkTypes[type];
                const actionText = config.action === 'open' ? '打开' : '复制';
                if (count > 0) {
                    buttons[type].textContent = `${config.icon} ${actionText}${config.name} (${count})`;
                    buttons[type].style.opacity = '1';
                    buttons[type].style.pointerEvents = 'auto';
                } else {
                    buttons[type].textContent = `${config.icon} ${actionText}${config.name} (0)`;
                    buttons[type].style.opacity = '0.5';
                    buttons[type].style.pointerEvents = 'none';
                }
            }
        });

        if (totalFound > 0) {
            const messages = [];
            if (foundLinks.ed2k.length > 0) messages.push(`${foundLinks.ed2k.length}个ed2k`);
            if (foundLinks.magnet.length > 0) messages.push(`${foundLinks.magnet.length}个磁力`);
            if (foundLinks.pan115.length > 0) messages.push(`${foundLinks.pan115.length}个115网盘`);
            showIndicator(`找到 ${messages.join('、')}`);
        }
    }

    // 显示提示
    function showIndicator(message) {
        if (indicator) {
            indicator.textContent = message;
            indicator.style.display = 'block';
            setTimeout(() => {
                indicator.style.display = 'none';
            }, 3000);
        }
    }

    // 显示通知
    function showNotification(message, type = 'info') {
        // 尝试使用GM_notification
        if (typeof GM_notification !== 'undefined') {
            GM_notification({
                text: message,
                title: 'ed2k复制工具',
                timeout: 3000,
                image: type === 'success' ? '✅' : '❌'
            });
        } else {
            // 降级方案：创建临时通知
            const notification = document.createElement('div');
            notification.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: ${type === 'success' ? '#4CAF50' : '#f44336'};
                color: white;
                padding: 20px 30px;
                border-radius: 10px;
                font-size: 16px;
                z-index: 10000;
                box-shadow: 0 4px 20px rgba(0,0,0,0.3);
                animation: fadeInOut 3s ease-in-out;
            `;
            notification.textContent = message;

            // 添加动画样式
            if (!document.getElementById('notification-style')) {
                const style = document.createElement('style');
                style.id = 'notification-style';
                style.textContent = `
                    @keyframes fadeInOut {
                        0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
                        10% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                        90% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                        100% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
                    }
                `;
                document.head.appendChild(style);
            }

            document.body.appendChild(notification);
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 3000);
        }
    }

    // 检测是否为移动设备
    function isMobileDevice() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    // 设置MutationObserver监听DOM变化
    function setupMutationObserver() {
        const observer = new MutationObserver((mutations) => {
            let shouldRescan = false;

            mutations.forEach((mutation) => {
                if (mutation.addedNodes.length > 0) {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            const text = node.textContent || '';
                            if (text.includes('ed2k://') || text.includes('magnet:?') || text.includes('115cdn.com') || text.includes('115.com/s/')) {
                                shouldRescan = true;
                            }
                        }
                    });
                }
            });

            if (shouldRescan) {
                setTimeout(() => {
                    scanForEd2kLinks();
                }, 500);
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
            characterData: true
        });
    }

    // 启动脚本
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
