const fs = require('fs');
const path = require('path');
const moment = require('moment');

class HistoryUtils {
    // 포스팅 기록 관리 함수
    savePostHistory(contentItem) {
        const historyFile = path.join(__dirname, 'post_history.json');
        let history = [];

        // 기존 기록 불러오기
        if (fs.existsSync(historyFile)) {
            const data = fs.readFileSync(historyFile, 'utf8');
            try {
                history = JSON.parse(data);
            } catch (e) {
                console.error('기록 파일 파싱 오류:', e.message);
            }
        }

        // 새 포스트 기록 추가
        history.push({
            title: contentItem.title,
            postedAt: new Date().toISOString(),
            category: contentItem.category,
            source: contentItem.source,
        });

        // 기록 저장
        fs.writeFileSync(historyFile, JSON.stringify(history, null, 2), 'utf8');
        console.log('포스트 기록 저장 완료');
    }

    // 오늘 포스팅 수 확인 함수
    getTodayPostCount() {
        const historyFile = path.join(__dirname, 'post_history.json');

        if (!fs.existsSync(historyFile)) {
            return 0;
        }

        const data = fs.readFileSync(historyFile, 'utf8');
        let history = [];

        try {
            history = JSON.parse(data);
        } catch (e) {
            return 0;
        }

        // 오늘 날짜의 포스트만 필터링
        const today = moment().startOf('day');
        const todayPosts = history.filter((post) => {
            const postDate = moment(post.postedAt);
            return postDate >= today;
        });

        return todayPosts.length;
    }

    // 중복 포스트 체크 함수
    isDuplicatePost(title) {
        const historyFile = path.join(__dirname, 'post_history.json');

        if (!fs.existsSync(historyFile)) {
            return false;
        }

        const data = fs.readFileSync(historyFile, 'utf8');
        let history = [];

        try {
            history = JSON.parse(data);
        } catch (e) {
            return false;
        }

        // 제목 기준으로 중복 체크
        return history.some((post) => post.title.trim() === title.trim());
    }
}

module.exports = new HistoryUtils();
