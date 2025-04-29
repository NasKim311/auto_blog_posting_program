const fs = require('fs');
const path = require('path');
const CONFIG = require('../config/config');

class BlogService {
    constructor() {
        // screenshots 디렉토리 생성
        this.screenshotDir = path.join(process.cwd(), 'screenshots');
        if (!fs.existsSync(this.screenshotDir)) {
            fs.mkdirSync(this.screenshotDir, { recursive: true });
        }
    }

    async createBlogPost(browser, contentItem) {
        console.log(`새 포스트 작성 시작: ${contentItem.title}`);
        const page = await browser.newPage();

        try {
            await page.goto(CONFIG.writePostURL, {
                waitUntil: 'domcontentloaded',
                timeout: 60000,
            });

            // 현재 페이지 URL 출력 (디버깅용)
            const currentURL = page.url();
            console.log('현재 URL:', currentURL);

            // 로그인 여부 확인
            if (currentURL.includes('login.naver.com')) {
                throw new Error('로그인이 되어 있지 않습니다.');
            }

            try {
                await page.screenshot({
                    path: path.join(this.screenshotDir, 'write_page_loaded.png'),
                });
            } catch (screenshotError) {
                console.warn('스크린샷 저장 실패:', screenshotError.message);
            }

            // 제목 입력 대기 및 시도
            try {
                const subjectSelector = '#subject';
                await page.waitForSelector(subjectSelector, { timeout: 15000 });
                await page.type(subjectSelector, contentItem.title);
                console.log('제목 입력 완료');
            } catch (titleError) {
                console.error('제목 입력 실패:', titleError.message);
                throw new Error('제목 입력 실패');
            }

            // 본문 입력 (iframe)
            try {
                const frameSelector = 'iframe[title="본문 편집 영역"]';
                await page.waitForSelector(frameSelector, { timeout: 15000 });
                const editorFrameHandle = await page.$(frameSelector);
                const editorFrame = await editorFrameHandle.contentFrame();

                await editorFrame.evaluate((content) => {
                    document.body.innerHTML = `<p>${content.replace(/\n/g, '<br>')}</p>`;
                }, contentItem.content);
                console.log('본문 입력 완료');

                // 출처 추가
                await editorFrame.evaluate((source) => {
                    const sourcePara = document.createElement('p');
                    sourcePara.innerHTML = `<br><br>출처: ${source}`;
                    document.body.appendChild(sourcePara);
                }, contentItem.source);
            } catch (contentError) {
                console.error('본문 입력 실패:', contentError.message);
                throw new Error('본문 입력 실패');
            }

            // 이미지 업로드
            if (contentItem.images?.length) {
                for (const imagePath of contentItem.images) {
                    try {
                        const fileInput = await page.waitForSelector('input[type="file"]', {
                            timeout: 5000,
                            visible: true,
                        });
                        await fileInput.uploadFile(imagePath);
                        await this.checkImageUploadStatus(page);
                        await page.waitForTimeout(2000);
                        console.log(`이미지 업로드 성공: ${imagePath}`);
                    } catch (imageError) {
                        console.warn(`이미지 업로드 실패: ${imagePath}`, imageError.message);
                    }
                }
            }

            // 카테고리 선택
            try {
                const categorySelector = 'select[name="category"]';
                await page.waitForSelector(categorySelector, { timeout: 5000 });
                await page.select(categorySelector, contentItem.category);
                console.log('카테고리 선택 완료');
            } catch (categoryError) {
                console.warn('카테고리 선택 실패:', categoryError.message);
            }

            // 태그 입력
            try {
                const tagSelector = 'input[name="tag"]';
                const tagInput = await page.waitForSelector(tagSelector, { timeout: 5000 });
                await tagInput.type(contentItem.category);
                console.log('태그 입력 완료');
            } catch (tagError) {
                console.warn('태그 입력 실패:', tagError.message);
            }

            // 공개 설정
            try {
                await page.evaluate(() => {
                    const publicOption = document.querySelector('input[name="privacy"][value="0"]');
                    if (publicOption) publicOption.checked = true;
                });
            } catch (privacyError) {
                console.warn('공개 설정 실패:', privacyError.message);
            }

            // 발행 버튼 클릭
            try {
                const publishSelector = 'button.se_publish, button[data-module="PostSubmit"]';
                await page.waitForSelector(publishSelector, { timeout: 10000 });
                const publishBtn = await page.$(publishSelector);
                await publishBtn.click();
                console.log('발행 버튼 클릭 완료');

                // 발행 완료 대기
                await page.waitForNavigation({
                    waitUntil: 'networkidle0',
                    timeout: 30000,
                });
                console.log(`포스트 작성 완료: ${contentItem.title}`);
            } catch (publishError) {
                console.error('발행 실패:', publishError.message);
                throw new Error('발행 실패');
            }
        } catch (error) {
            console.error('포스트 작성 중 오류 발생:', error.message);
            try {
                await page.screenshot({
                    path: path.join(this.screenshotDir, 'error_state.png'),
                });
            } catch (screenshotError) {
                console.warn('에러 상태 스크린샷 저장 실패:', screenshotError.message);
            }
            throw error;
        } finally {
            await page.close();
        }

        return true;
    }

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
