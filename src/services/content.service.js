const axios = require('axios');
const cheerio = require('cheerio');

class ContentService {
    // 컨텐츠 수집 함수
    async collectContent() {
        console.log('컨텐츠 수집 시작...');
        const contents = [];

        // 여러 소스에서 컨텐츠 수집
        for (const sourceURL of CONFIG.contentSources) {
            try {
                const response = await axios.get(sourceURL);
                const $ = cheerio.load(response.data);

                // 이 부분은 크롤링하려는 웹사이트 구조에 맞게 수정해야 함
                const articles = $('.article-item').toArray();

                for (const article of articles) {
                    const title = $(article).find('.title').text().trim();
                    const content = $(article).find('.content').html();
                    const imageURLs = [];

                    $(article)
                        .find('img')
                        .each((i, img) => {
                            const imgSrc = $(img).attr('src');
                            if (imgSrc && !imgSrc.includes('data:image')) {
                                imageURLs.push(imgSrc);
                            }
                        });

                    if (title && content) {
                        contents.push({
                            title,
                            content: processContent(content),
                            images: imageURLs,
                            category: getRandomCategory(),
                            source: sourceURL,
                            collectedAt: new Date(),
                        });
                    }
                }
            } catch (error) {
                console.error(`${sourceURL} 에서 컨텐츠 수집 실패:`, error.message);
            }
        }

        console.log(`총 ${contents.length}개의 컨텐츠 항목 수집 완료`);
        return contents;
    }

    // 컨텐츠 처리 함수 (HTML 정리 등)
    processContent(rawContent) {
        // HTML에서 불필요한 태그 제거 및 내용 정리
        let processed = rawContent
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
            .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

        // 링크 태그 정리
        processed = processed.replace(/<a\s+[^>]*>/gi, '').replace(/<\/a>/gi, '');

        // 추가적인 컨텐츠 처리 - 예를 들어 AI로 내용 개선하는 부분을 추가할 수 있음

        return processed;
    }

    // 랜덤 카테고리 선택 함수
    getRandomCategory() {
        const randomIndex = Math.floor(Math.random() * CONFIG.categories.length);
        return CONFIG.categories[randomIndex];
    }
}

module.exports = new ContentService();
