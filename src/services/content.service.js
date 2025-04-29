const axios = require('axios');
const cheerio = require('cheerio');
const CONFIG = require('../config/config');

class ContentService {
    // 컨텐츠 수집 함수
    async collectContent() {
        console.log('컨텐츠 수집 시작...');
        const contents = [];

        try {
            // 한국관광공사 API를 통한 관광지 정보 수집
            const tourApiResponse = await axios.get(`https://apis.data.go.kr/B551011/KorService1/areaBasedList1?serviceKey=${CONFIG.apiKeys.tourApi}&numOfRows=10&pageNo=1&MobileOS=ETC&MobileApp=AppTest&_type=json&listYN=Y`);

            if (tourApiResponse.data.response.body.items.item) {
                const tourItems = tourApiResponse.data.response.body.items.item;
                for (const item of tourItems) {
                    contents.push({
                        title: `[여행] ${item.title}`,
                        content: this.processContent(`
                            <h2>${item.title}</h2>
                            <p>주소: ${item.addr1}</p>
                            ${item.firstimage ? `<img src="${item.firstimage}" alt="${item.title}">` : ''}
                            <p>${item.overview || '상세 정보 준비중입니다.'}</p>
                        `),
                        images: item.firstimage ? [item.firstimage] : [],
                        category: '여행',
                        source: '한국관광공사',
                        collectedAt: new Date(),
                    });
                }
            }

            // 기상청 API를 통한 날씨 정보 수집
            const weatherApiResponse = await axios.get(
                `https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst?serviceKey=${CONFIG.apiKeys.weatherApi}&numOfRows=10&pageNo=1&base_date=${this.getTodayDate()}&base_time=0800&nx=55&ny=127&dataType=JSON`,
            );

            if (weatherApiResponse.data.response.body.items.item) {
                const weatherItems = weatherApiResponse.data.response.body.items.item;
                const weatherInfo = this.processWeatherData(weatherItems);

                contents.push({
                    title: `[오늘의 날씨] ${this.getTodayDate()} 날씨 정보`,
                    content: this.processContent(`
                        <h2>오늘의 날씨 정보</h2>
                        <p>기온: ${weatherInfo.temp}°C</p>
                        <p>강수확률: ${weatherInfo.rainProb}%</p>
                        <p>습도: ${weatherInfo.humidity}%</p>
                        <p>날씨: ${weatherInfo.sky}</p>
                    `),
                    category: '일상',
                    source: '기상청',
                    collectedAt: new Date(),
                });
            }
        } catch (error) {
            console.error(`컨텐츠 수집 중 오류 발생:`, error.message);
        }

        console.log(`총 ${contents.length}개의 컨텐츠 항목 수집 완료`);
        return contents;
    }

    getTodayDate() {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}${month}${day}`;
    }

    processWeatherData(items) {
        const weatherInfo = {
            temp: '알 수 없음',
            rainProb: '알 수 없음',
            humidity: '알 수 없음',
            sky: '알 수 없음',
        };

        for (const item of items) {
            switch (item.category) {
                case 'TMP': // 기온
                    weatherInfo.temp = item.fcstValue;
                    break;
                case 'POP': // 강수확률
                    weatherInfo.rainProb = item.fcstValue;
                    break;
                case 'REH': // 습도
                    weatherInfo.humidity = item.fcstValue;
                    break;
                case 'SKY': // 하늘상태
                    weatherInfo.sky = this.getSkyStatus(item.fcstValue);
                    break;
            }
        }

        return weatherInfo;
    }

    getSkyStatus(code) {
        switch (code) {
            case '1':
                return '맑음';
            case '2':
                return '구름조금';
            case '3':
                return '구름많음';
            case '4':
                return '흐림';
            default:
                return '알 수 없음';
        }
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
