require('dotenv').config();

module.exports = {
    loginURL: 'https://nid.naver.com/nidlogin.login',
    blogMainURL: 'https://blog.naver.com',
    writePostURL: `https://blog.naver.com/${process.env.NAVER_ID}?Redirect=Write`,
    contentSources: [
        'https://www.data.go.kr/tcs/dss/selectDataSetList.do', // 공공데이터 포털
        'https://api.visitkorea.or.kr/#/sample', // 한국관광공사 API
        'https://www.weather.go.kr/w/index.do', // 기상청 날씨 정보
    ],
    apiKeys: {
        tourApi: process.env.TOUR_API_KEY,
        weatherApi: process.env.WEATHER_API_KEY,
    },
    categories: ['일상', '여행', '맛집', '리뷰'], // 블로그 카테고리 목록
    postInterval: 3600000, // 포스팅 간격 (1시간)
    maxPostsPerDay: 5, // 하루 최대 포스팅 수
};
