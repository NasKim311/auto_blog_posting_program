// 필요한 모듈 불러오기
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');
const moment = require('moment');
require('dotenv').config();

// 설정 값
const CONFIG = {
    loginURL: 'https://nid.naver.com/nidlogin.login',
    blogMainURL: 'https://blog.naver.com',
    writePostURL: 'https://blog.naver.com/PostWrite.naver',
    contentSources: [
        'https://www.example.com/news', // 컨텐츠를 가져올 소스 URL
        'https://www.example2.com/articles',
    ],
    categories: ['일상', '여행', '맛집', '리뷰'], // 블로그 카테고리 목록
    postInterval: 3600000, // 포스팅 간격 (1시간)
    maxPostsPerDay: 5, // 하루 최대 포스팅 수
};

// 프로그램 시작
main().catch(console.error);
