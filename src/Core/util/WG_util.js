import {getRuntime} from "../StoreControl/StoreControl";
import {SyncCurrentStatus, getStatus} from "../StoreControl/StoreControl";
import logger from "./logger";

// 处理脚本


function processSentence(i) {
    const getVocalFromArgs = (text)=>{
        const args = text.split(' ');
        const vocalArg = args[args.length - 1];
        const vocalName = vocalArg.replace(/-/,'');//语音参数是最后一个参数
        const showText = text.replace(vocalArg, '')//去除语句中的语音参数
        logger.debug('say参数', args);
        const returnVocal = vocalName;
        // noinspection UnnecessaryLocalVariableJS
        const returnText = showText;
        return{vocal:returnVocal,text:returnText};
    }

    if (i < getRuntime().currentScene.length) {
        let vocal = '';
        if (getRuntime().currentScene[i][1] !== '') {
            let text = getRuntime().currentScene[i][1];
            //语音作为参数的情况，最优先考虑
            if (text.match(/ -/)) {
                vocal = getVocalFromArgs(text).vocal;
                text = getVocalFromArgs(text).text;
            } else if (getRuntime().currentScene[i][1].split('vocal-').length > 1) {  //语音参数前置的情况
                vocal = getRuntime().currentScene[i][1].split('vocal-')[1].split(',')[0];
                text = getRuntime().currentScene[i][1].split('vocal-')[1].slice(getRuntime().currentScene[i][1].split('vocal-')[1].split(',')[0].length + 1);
            }
            SyncCurrentStatus("showName", getRuntime().currentScene[i][0]);
            return {name: getStatus('showName'), text: text, vocal: vocal};
        } else {
            let text = getRuntime().currentScene[i][0];
            //语音作为参数的情况，最优先考虑
            if (text.match(/ -/)) {
                vocal = getVocalFromArgs(text).vocal;
                text = getVocalFromArgs(text).text;
            } else if (getRuntime().currentScene[i][0].split('vocal-').length > 1) {
                vocal = getRuntime().currentScene[i][0].split('vocal-')[1].split(',')[0];
                text = getRuntime().currentScene[i][0].split('vocal-')[1].slice(getRuntime().currentScene[i][0].split('vocal-')[1].split(',')[0].length + 1);
                text = text.split(";")[0];
            }
            return {name: getStatus('showName'), text: text, vocal: vocal};
        }


    }

}

/**
 * 查询当前组件状态
 * @param {string | Array.<string> | undefined} widgets
 * @returns {boolean | Map.<string, boolean>}
 */
function queryWidgetState(widgets) {
    const name2query = new Map([['TitleScreen', 'div#Title'], ['TextBox', 'div#bottomBox'], ['SaveScreen', 'div#Save'], ['LoadScreen', 'div#Load'], ['SettingScreen', 'div#settings'], ['BacklogScreen', 'div#backlog'], ['PanicScreen', 'div#panic-overlay'],]);

    let reduce = false;
    if (typeof (widgets) === 'string') {
        widgets = [widgets,];
        reduce = true;
    } else if (widgets === undefined) {
        widgets = Array.from(name2query.keys())
    }

    let state_map = new Map();
    for (const wi of widgets) {
        const query = name2query.get(wi);
        if (query === undefined) throw new RangeError(`No widget named ${wi}.`);
        const ele = document.querySelector(query);
        let disp = ele.style.display;
        if (disp === '') disp = window.getComputedStyle(ele).display;
        state_map.set(wi, disp !== 'none');
    }

    if (reduce) state_map = state_map.values().next().value
    return state_map;
}

function loadSettings() {
    if (getRuntime().Settings["font_size"] === 'small') {
        document.getElementById('SceneText').style.fontSize = '150%';
    } else if (getRuntime().Settings["font_size"] === 'medium') {
        document.getElementById('SceneText').style.fontSize = '200%';
    } else if (getRuntime().Settings["font_size"] === 'large') {
        document.getElementById('SceneText').style.fontSize = '250%';
    }

    if (getRuntime().Settings["play_speed"] === 'low') {
        getRuntime().textShowWaitTime = 150;
    } else if (getRuntime().Settings["play_speed"] === 'medium') {
        getRuntime().textShowWaitTime = 50;
    } else if (getRuntime().Settings["play_speed"] === 'fast') {
        getRuntime().textShowWaitTime = 10;
    }
}

/**
 * 略过 ignore，检测 states 中所有组件是否均隐藏
 * @param {Map.<string, boolean>} states
 * @param {string | Array.<string> | undefined} ignore
 * @returns {boolean}
 */
function AllHiddenIgnore(states, ignore) {
    if (typeof (ignore) === 'string') ignore = [ignore,]; else if (ignore === undefined) ignore = []
    for (const [key, value] of states) {
        if (value === true && !ignore.includes(key)) return false;
    }
    return true;
}

//手机优化
function isMobile() {
    let info = navigator.userAgent;
    let agents = ["Android", "iPhone", "SymbianOS", "Windows Phone", "iPod", "iPad"];
    for (let i = 0; i < agents.length; i++) {
        if (info.indexOf(agents[i]) >= 0) return true;
    }
    return false;
}

function MobileChangeStyle() {
    logger.warn("手机视图");
    document.getElementById('bottomBox').style.height = '45%';
    document.getElementById('ReactRoot').style.fontSize = '65%';
    document.getElementById('mainTextWindow').style.padding = '5px 20% 5px 20%';
    document.getElementById('SceneText').style.padding = '5px 0 0 0';
    forceRotate();
}

function forceRotate() {
    const width = document.documentElement.clientWidth;
    const height = document.documentElement.clientHeight;
    var screen_width = width; //屏幕宽度
    const contentDOM = document.getElementById('ReactRoot');
    if (width < height) {
        screen_width = height; //如果 是竖屏，灵感的宽度就等于屏高
        contentDOM.style.width = height + 'px';
        contentDOM.style.height = width + 'px';
        contentDOM.style.position = 'relative'
        contentDOM.style.top = (height - width) / 2 + 'px';
        contentDOM.style.left = 0 - (height - width) / 2 + 'px';
        contentDOM.style.transform = 'rotate(90deg)';
    }
//根据手机旋转的角度来判断
    const evt = "onorientationchange" in window ? "orientationchange" : "resize"; //旋转事件
    window.addEventListener(evt, function () { //事件监听
        if (window.orientation === 90 || window.orientation === -90) { //旋转到 90 或 -90 度，即竖屏到横屏
            screen_width = height; //横屏，灵感的宽度就等于屏高
            contentDOM.style.width = height + 'px';
            contentDOM.style.height = width + 'px';
            contentDOM.style.position = 'relative'
            contentDOM.style.top = '0px';
            contentDOM.style.left = '0px';
            contentDOM.style.transform = 'none'; //不旋转；
        } else { //旋转到 180 或 0 度，即横屏到竖屏
            screen_width = height; //竖屏，灵感的宽度就等于屏高
            contentDOM.style.width = height + 'px';
            contentDOM.style.height = width + 'px';
            contentDOM.style.position = 'relative'
            contentDOM.style.top = (height - width) / 2 + 'px';
            contentDOM.style.left = 0 - (height - width) / 2 + 'px';
            contentDOM.style.transform = 'rotate(90deg)'; //旋转90度
        }
    }, false);
}

function processSelection(chooseItems) {
    //使用|作为分隔的情况
    if (chooseItems.match(/\|/)) {
        chooseItems = chooseItems.split("}")[0];
        chooseItems = chooseItems.split("{")[1];
        let selection = chooseItems.split(/\|/);
        for (let i = 0; i < selection.length; i++) {
            selection[i] = selection[i].split(":");
        }
        logger.debug('selection by |:',selection);
        return selection;
    }
    //以下是使用逗号分隔的情况
    chooseItems = chooseItems.split("}")[0];
    chooseItems = chooseItems.split("{")[1];
    let selection = chooseItems.split(',')
    logger.debug('selection:',selection);
    for (let i = 0; i < selection.length; i++) {
        selection[i] = selection[i].split(":");
    }
    return selection;
}

export {processSentence, queryWidgetState, loadSettings, AllHiddenIgnore, isMobile, MobileChangeStyle, processSelection}