const CONFIG = require('../config/config');

class AuthService {
    // 네이버 로그인 함수
    async naverLogin(browser) {
        console.log('네이버 로그인 시작...');
        const page = await browser.newPage();

        // 로그인 페이지로 이동
        await page.goto(CONFIG.loginURL);
        await page.waitForSelector('#id');

        // 로그인 정보 입력
        await page.evaluate(
            (id, pw) => {
                document.querySelector('#id').value = id;
                document.querySelector('#pw').value = pw;
            },
            process.env.NAVER_ID,
            process.env.NAVER_PW,
        );

        // 로그인 버튼 클릭
        await page.click('.btn_login');

        // 로그인 성공 여부 확인 (네이버 메인으로 리다이렉트 되는지)
        await page.waitForNavigation();

        const currentURL = page.url();
        if (currentURL.includes('naver.com') && !currentURL.includes('nidlogin')) {
            console.log('로그인 성공!');
            return true;
        } else {
            console.error('로그인 실패!');
            return false;
        }
    }
}

module.exports = new AuthService();
