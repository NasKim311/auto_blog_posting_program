// src/test.js
const axios = require('axios');
require('dotenv').config();

async function testAPIs() {
    try {
        // 관광공사 API 테스트
        console.log('관광공사 API 테스트 중...');
        const tourResponse = await axios.get(`https://apis.data.go.kr/B551011/KorService1/areaBasedList1?serviceKey=${process.env.TOUR_API_KEY}&numOfRows=1&pageNo=1&MobileOS=ETC&MobileApp=AppTest&_type=json&listYN=Y`);
        console.log('관광공사 API 응답:', JSON.stringify(tourResponse.data, null, 2));

        // 기상청 API 테스트
        console.log('\n기상청 API 테스트 중...');
        const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const weatherResponse = await axios.get(`https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst?serviceKey=${process.env.WEATHER_API_KEY}&numOfRows=10&pageNo=1&base_date=${today}&base_time=0800&nx=55&ny=127&dataType=JSON`);
        console.log('기상청 API 응답:', JSON.stringify(weatherResponse.data, null, 2));
    } catch (error) {
        console.error('에러 발생:', error.response ? error.response.data : error.message);
    }
}

testAPIs();
