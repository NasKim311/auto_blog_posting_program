const fs = require('fs');
const CONFIG = require('../config/config');

class BlogService {
    // 블로그 포스팅 함수
    async createBlogPost(browser, contentItem) {
        console.log(`새 포스트 작성 시작: ${contentItem.title}`);
        const page = await browser.newPage();

        // 포스트 작성 페이지로 이동
        await page.goto(CONFIG.writePostURL);

        // 새로운 에디터 로딩 대기
        await page.waitForSelector('.se-container');

        // 제목 입력 (새로운 셀렉터)
        await page.waitForSelector('.se-title-text');
        await page.click('.se-title-text');
        await page.keyboard.type(contentItem.title);

        // 본문 영역 클릭
        await page.waitForSelector('.se-component-content');
        await page.click('.se-component-content');

        // 이미지 업로드 (새로운 방식)
        if (contentItem.images && contentItem.images.length > 0) {
            for (const imagePath of contentItem.images) {
                // 이미지 업로드 버튼 클릭
                await page.waitForSelector('.se-toolbar-item-image');
                await page.click('.se-toolbar-item-image');

                // 파일 선택 input 대기 및 업로드
                const [fileChooser] = await Promise.all([page.waitForFileChooser(), page.click('.se-image-file-input')]);
                await fileChooser.accept([imagePath]);

                // 이미지 업로드 완료 대기
                await page.waitForSelector('.se-image-container img');
                await page.waitForTimeout(1000);
            }
        }

        // 본문 내용 입력
        await page.evaluate((content) => {
            const contentArea = document.querySelector('.se-component-content');
            if (contentArea) {
                // HTML 내용을 텍스트로 변환하여 입력
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = content;
                contentArea.textContent = tempDiv.textContent;
            }
        }, contentItem.content);

        // 출처 표시 추가
        await page.keyboard.press('Enter');
        await page.keyboard.type(`\n출처: ${contentItem.source}`);

        // 카테고리 선택
        await page.waitForSelector('.category-select-button');
        await page.click('.category-select-button');
        await page.waitForSelector('.category-item');

        // 카테고리 목록에서 해당하는 카테고리 찾아 클릭
        await page.evaluate((category) => {
            const categoryItems = Array.from(document.querySelectorAll('.category-item'));
            const targetCategory = categoryItems.find((item) => item.textContent.includes(category));
            if (targetCategory) targetCategory.click();
        }, contentItem.category);

        // 발행 버튼 클릭
        await page.waitForSelector('.publish-button');
        await page.click('.publish-button');

        // 발행 확인 모달이 있는 경우
        try {
            await page.waitForSelector('.confirm-button', { timeout: 5000 });
            await page.click('.confirm-button');
        } catch (e) {
            console.log('확인 모달이 없습니다.');
        }

        // 발행 완료 대기
        await page.waitForSelector('.publish-complete', { timeout: 30000 });
        console.log(`포스트 작성 완료: ${contentItem.title}`);

        // 페이지 닫기
        await page.close();

        return true;
    }
}

module.exports = new BlogService();
