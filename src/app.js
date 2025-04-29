const puppeteer = require('puppeteer');
const authService = require('./services/auth.service');
const blogService = require('./services/blog.service');
const contentService = require('./services/content.service');
const historyUtil = require('./utils/history.util');
const CONFIG = require('./config/config');

// 포스팅 사이클 실행 함수
async function runPostingCycle(browser) {
    try {
        // 오늘 포스팅 수 확인
        const todayPostCount = historyUtil.getTodayPostCount();
        console.log(`오늘 작성된 포스트 수: ${todayPostCount}/${CONFIG.maxPostsPerDay}`);

        if (todayPostCount >= CONFIG.maxPostsPerDay) {
            console.log('오늘의 최대 포스팅 수에 도달했습니다. 내일 다시 시도합니다.');
            return;
        }

        // 컨텐츠 수집
        const contents = await contentService.collectContent();

        // 중복되지 않은 컨텐츠만 필터링
        const uniqueContents = contents.filter((item) => !historyUtil.isDuplicatePost(item.title));
        console.log(`중복 제외 ${uniqueContents.length}개의 컨텐츠 항목 남음`);

        if (uniqueContents.length === 0) {
            console.log('포스팅할 새로운 컨텐츠가 없습니다.');
            return;
        }

        // 포스팅할 컨텐츠 선택 (첫번째 항목)
        const contentToPost = uniqueContents[0];

        // 블로그 포스팅
        const postSuccess = await blogService.createBlogPost(browser, contentToPost);

        if (postSuccess) {
            // 포스팅 기록 저장
            historyUtil.savePostHistory(contentToPost);
        }
    } catch (error) {
        console.error('포스팅 사이클 실행 중 오류:', error);
    }
}

// 메인 실행 함수
async function main() {
    console.log('네이버 블로그 자동 포스팅 프로그램 시작...');

    // 브라우저 실행
    const browser = await puppeteer.launch({
        headless: false, // 디버깅을 위해 false로 설정
        defaultViewport: null,
        args: ['--window-size=1366,768'],
    });

    try {
        // 네이버 로그인
        const loginSuccess = await authService.naverLogin(browser);
        if (!loginSuccess) {
            throw new Error('로그인에 실패했습니다. 아이디와 비밀번호를 확인해주세요.');
        }

        // 포스팅 주기적 실행 (프로그램 시작시 즉시 한 번 실행하고, 이후 정해진 간격으로 실행)
        await runPostingCycle(browser);

        // 정해진 간격으로 포스팅 실행
        setInterval(async () => {
            await runPostingCycle(browser);
        }, CONFIG.postInterval);
    } catch (error) {
        console.error('프로그램 실행 중 오류 발생:', error);
        await browser.close();
    }
}

main().catch(console.error);
