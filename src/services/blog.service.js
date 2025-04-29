const fs = require('fs');
const path = require('path');

class BlogService {
    // 블로그 포스팅 함수
    async createBlogPost(browser, contentItem) {
        console.log(`새 포스트 작성 시작: ${contentItem.title}`);
        const page = await browser.newPage();

        // 포스트 작성 페이지로 이동
        await page.goto(CONFIG.writePostURL);
        await page.waitForSelector('#title');

        // 제목 입력
        await page.type('#title', contentItem.title);

        // 카테고리 선택
        await page.select('#categoryTitle', contentItem.category);

        // 이미지 다운로드 및 업로드
        const imagePaths = await downloadImages(contentItem.images);

        // 각 이미지 업로드
        for (const imagePath of imagePaths) {
            await page.waitForSelector('input[type="file"]');
            const fileInput = await page.$('input[type="file"]');
            await fileInput.uploadFile(imagePath);
            await page.waitForTimeout(2000); // 이미지 업로드 대기
        }

        // 에디터에 컨텐츠 입력 (에디터 타입에 따라 다를 수 있음)
        // 스마트 에디터의 경우
        await page.evaluate((content) => {
            // iframe 내의 에디터에 접근
            const editorFrame = document.querySelector('#se2_iframe');
            const editorDocument = editorFrame.contentDocument || editorFrame.contentWindow.document;
            const editorBody = editorDocument.querySelector('body');
            editorBody.innerHTML = content;
        }, contentItem.content);

        // 출처 표시 추가
        await page.evaluate((source) => {
            const editorFrame = document.querySelector('#se2_iframe');
            const editorDocument = editorFrame.contentDocument || editorFrame.contentWindow.document;
            const editorBody = editorDocument.querySelector('body');

            const sourceDiv = editorDocument.createElement('div');
            sourceDiv.style.marginTop = '30px';
            sourceDiv.style.borderTop = '1px solid #eee';
            sourceDiv.style.paddingTop = '10px';
            sourceDiv.style.color = '#888';
            sourceDiv.innerHTML = `<p>출처: ${source}</p>`;

            editorBody.appendChild(sourceDiv);
        }, contentItem.source);

        // 발행 버튼 클릭
        await page.click('#btn_submit');

        // 발행 확인 모달이 있는 경우
        try {
            await page.waitForSelector('.confirm_btn', { timeout: 5000 });
            await page.click('.confirm_btn');
        } catch (e) {
            // 모달이 없으면 무시
        }

        console.log(`포스트 작성 완료: ${contentItem.title}`);

        // 임시 이미지 파일 삭제
        for (const imagePath of imagePaths) {
            try {
                fs.unlinkSync(imagePath);
            } catch (error) {
                console.error(`이미지 파일 삭제 실패: ${imagePath}`, error.message);
            }
        }

        return true;
    }
}

module.exports = new BlogService();
