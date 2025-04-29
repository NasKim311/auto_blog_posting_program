const fs = require('fs');
const CONFIG = require('../config/config');

class BlogService {
    // 블로그 포스팅 함수
    async createBlogPost(browser, contentItem) {
        console.log(`새 포스트 작성 시작: ${contentItem.title}`);
        const page = await browser.newPage();

        try {
            // 포스트 작성 페이지로 이동
            await page.goto(CONFIG.writePostURL, {
                waitUntil: 'networkidle0',
                timeout: 60000,
            });

            // 제목 입력
            await page.waitForSelector('#subject');
            await page.type('#subject', contentItem.title);

            // 본문 입력 (iframe 접근)
            await page.waitForSelector('iframe[title="본문 편집 영역"]');
            const editorFrame = await page.$('iframe[title="본문 편집 영역"]');
            const editor = await editorFrame.contentFrame();

            await editor.evaluate((content) => {
                document.body.innerHTML = `<p>${content.replace(/\n/g, '<br>')}</p>`;
            }, contentItem.content);

            // 출처 추가
            await editor.evaluate((source) => {
                const sourcePara = document.createElement('p');
                sourcePara.innerText = `출처: ${source}`;
                document.body.appendChild(sourcePara);
            }, contentItem.source);

            // 이미지 업로드
            if (contentItem.images && contentItem.images.length > 0) {
                for (const imagePath of contentItem.images) {
                    try {
                        const fileInput = await page.waitForSelector('input[type="file"]', { timeout: 5000 });
                        await fileInput.uploadFile(imagePath);
                        await this.checkImageUploadStatus(page);
                        await page.waitForTimeout(2000); // 이미지 업로드 간 대기
                    } catch (e) {
                        console.warn(`이미지 업로드 실패: ${imagePath}`, e);
                    }
                }
            }

            // 카테고리 선택
            try {
                await page.waitForSelector('select[name="category"]', { timeout: 3000 });
                await page.select('select[name="category"]', contentItem.category);
            } catch (e) {
                console.warn('카테고리 셀렉터를 찾지 못했습니다.');
            }

            // 태그 입력
            try {
                const tagInput = await page.waitForSelector('input[name="tag"]', { timeout: 5000 });
                if (tagInput) {
                    await tagInput.type(contentItem.category);
                }
            } catch (e) {
                console.log('태그 입력란 없음');
            }

            // 공개 설정 (공개로 설정)
            await page.evaluate(() => {
                const publicOption = document.querySelector('input[name="privacy"][value="0"]');
                if (publicOption) publicOption.checked = true;
            });

            // 발행 버튼 클릭
            await page.waitForSelector('button.se_publish');
            await page.click('button.se_publish');

            // 발행 완료 대기
            await page.waitForNavigation({
                waitUntil: 'networkidle0',
                timeout: 30000,
            });

            console.log(`포스트 작성 완료: ${contentItem.title}`);
        } catch (error) {
            console.error('포스트 작성 중 오류 발생:', error);
            throw error;
        } finally {
            await page.close();
        }

        return true;
    }

    // 이미지 업로드 상태 확인
    async checkImageUploadStatus(page) {
        try {
            await page.waitForFunction(() => !document.querySelector('.upload-progress'), { timeout: 30000 });
            return true;
        } catch (error) {
            console.error('이미지 업로드 대기 중 타임아웃');
            return false;
        }
    }
}

module.exports = new BlogService();
