const gameData = {
    startLocation: { r: 1, c: 1 },
    endLocation: { r: 5, c: 4 },
    gridSize: { rows: 5, cols: 4 },
    nodes: {
        "1_1": {
            name: "고양이 급식소 (Cat Food Base)",
            description: "당신의 아지트이자 안식처. 사료가 담긴 그릇과 쉼터가 정겹게 놓여 있다. 이태원 2동의 좁은 고양이길 탐험을 시작할 완벽한 출발점.",
            barrier: null,
            image: "extracted_photos/img_1_1.png",
            mask: "extracted_masks/mask_1_1.png"
        },
        "1_2": {
            name: "침목 계단길 (Wooden Steps)",
            description: "수풀 사이에 좁은 나무 침목 계단이 철길처럼 뻗어 있다. 가파르지만 발톱을 걸치고 빠르게 올라가기 좋은 최고의 생태 통로.",
            barrier: null,
            image: "extracted_photos/img_1_2.png",
            mask: "extracted_masks/mask_1_2.png"
        },
        "1_3": {
            name: "붉은 대문 골목 (Red Gate Path)",
            description: "좁은 경사로에 커다랗고 강렬한 붉은색 대문이 버티고 서 있다. 지나가는 사람들의 시선이 자주 머무는 인간 감시가 다소 빈번한 구역.",
            barrier: {
                id: "gate_watch",
                type: "stealth",
                msg: "인간들이 붉은 대문 앞을 지나다니고 있어 그냥 통과할 수 없습니다.",
                hackLabel: "어둠 속으로 슬며시 녹아들기 (클로킹)",
                successMsg: "인간들의 시선이 분산된 틈을 타 어두운 틈새로 살며시 빠져나갔습니다.",
                failMsg: "쉿! 사람들과 눈이 마주쳐 경계했습니다. 일단 숨으세요.",
                difficulty: 2
            },
            image: "extracted_photos/img_1_3.png",
            mask: "extracted_masks/mask_1_3.png"
        },
        "1_4": {
            name: "식물 벤치 밑 (Bench Hideout)",
            description: "길가에 놓인 큰 화분과 긴 나무 벤치. 벤치 아래의 그늘은 인간들의 발길을 완벽히 피할 수 있는 훌륭한 은신처다.",
            barrier: null,
            image: "extracted_photos/img_1_4.png",
            mask: "extracted_masks/mask_1_4.png"
        },
        "2_1": {
            name: "차 위의 고양이 (Car Top Cat)",
            description: "검은색 세단 승용차 지붕 위에 먼저 자리를 잡은 이웃 고양이가 식빵을 굽고 있다. 이 구역의 터줏대감 같은 녀석이다. 먼저 인사를 해야 갈 길을 열어줄 것 같다.",
            barrier: {
                id: "meet_cat",
                type: "social",
                msg: "승용차 위의 고양이가 하악질을 하며 길을 막고 있습니다.",
                hackLabel: "우호의 울음소리 (냥냥거리기)",
                successMsg: "나지막한 '냥-' 소리로 아는 체를 하자, 지붕 고양이가 꼬리를 살랑이며 길을 내줍니다.",
                failMsg: "하악질이 돌아왔습니다. 녀석의 덩치가 당신보다 큽니다. 잠시 기다려야 할 것 같습니다.",
                difficulty: 3
            },
            image: "extracted_photos/img_2_1.png",
            mask: "extracted_masks/mask_2_1.png"
        },
        "2_2": {
            name: "돌축대 계단길 (Stone Wall Stairs)",
            description: "가파른 돌축대 벽을 타고 지그재그로 올라가는 시멘트 계단길. 계단 꼭대기에 커다란 개 한 마리가 지키고 서 있는 게 느껴진다.",
            barrier: {
                id: "dog_patrol",
                type: "distract",
                msg: "동네 순찰 중인 커다란 황구가 계단 위에서 경계를 서고 있습니다.",
                hackLabel: "소리 질러 황구 시선 돌리기",
                successMsg: "근처 쓰레기통을 살짝 건드려 덜컹 소리를 냈습니다. 황구가 소리가 난 방향으로 달려간 틈에 계단 위로 잽싸게 질주합니다.",
                failMsg: "황구가 당신을 매섭게 쳐다봅니다! 한 걸음만 더 다가가면 짖어댈 기세입니다.",
                difficulty: 4
            },
            image: "extracted_photos/img_2_2.png",
            mask: "extracted_masks/mask_2_2.png"
        },
        "2_3": {
            name: "베이스캠프 남산 벽 (Namsan Basecamp)",
            description: "'BASECAMP NAMSAN'이라는 파란 글자가 찍힌 시멘트 옥상 건물. 남산 꼭대기와 소월로의 바람이 한눈에 느껴지는 탁 트인 고지대다.",
            barrier: null,
            image: "extracted_photos/img_2_3.png",
            mask: "extracted_masks/mask_2_3.png"
        },
        "2_4": {
            name: "볼라드 구역 (Bollard Boundary)",
            description: "인간들의 육중한 차량 진입을 통제하기 위해 박혀 있는 붉은색/노란색 머리의 쇠 볼라드들. 고양이들에게는 가볍게 넘나드는 도보 장애물에 불과하다.",
            barrier: null,
            image: "extracted_photos/img_2_4.png",
            mask: "extracted_masks/mask_2_4.png"
        },
        "3_1": {
            name: "번호 적힌 계단길 (Numbered Steps)",
            description: "하얀 시멘트 계단 첫 단에 '32'라는 숫자가 빨갛게 칠해져 있다. 인간이 영토를 구획하기 위해 써놓은 코드인 모양이다.",
            barrier: null,
            image: "extracted_photos/img_3_1.png",
            mask: "extracted_masks/mask_3_1.png"
        },
        "3_2": {
            name: "창문 턱 통로 (Window Sill Walk)",
            description: "골목 안쪽 건물들의 창문들이 굳게 닫혀 있다. 가로로 뻗은 창문 턱은 인간들이 모르는 우리들의 좁고 평화로운 지상 통로다.",
            barrier: null,
            image: "extracted_photos/img_3_2.png",
            mask: "extracted_masks/mask_3_2.png"
        },
        "3_3": {
            name: "소월문 벽면 (sowolMoon Wall)",
            description: "'SGAK'과 'sowolMoon' 글자가 멋스럽게 적힌 회색빛 건물 외벽. 이태원 2동의 힙한 문화적 공기가 가득 묻어나는 벽면이다.",
            barrier: null,
            image: "extracted_photos/img_3_3.png",
            mask: "extracted_masks/mask_3_3.png"
        },
        "3_4": {
            name: "보안 감시 철문 (Secure Gate)",
            description: "불빛이 환하게 켜진 단독주택의 굳건한 보안 철문. 문 위에 설치된 인간의 '감시 카메(CCTV)'가 렌즈를 천천히 돌리며 감시하고 있다.",
            barrier: {
                id: "cctv_sensor",
                type: "hack",
                msg: "작동 중인 방범용 CCTV가 골목 정중앙을 비추고 있어 그냥 지나가면 경보가 울립니다.",
                hackLabel: "감시 카메라 사각지대 침투 (카메라 해킹)",
                successMsg: "카메라가 반대쪽으로 고개를 돌린 타이밍을 포착해 기둥 그림자를 타고 유령처럼 통과했습니다.",
                failMsg: "카메라 렌즈 밑의 빨간 센서 등이 깜빡입니다! 감지 영역에서 얼른 발을 뺍니다.",
                difficulty: 4
            },
            image: "extracted_photos/img_3_4.png",
            mask: "extracted_masks/mask_3_4.png"
        },
        "4_1": {
            name: "백구 동상 쇼윈도 - 서쪽 (West Gallery Window)",
            description: "하얀색 커다란 백구 동상이 세워져 있는 밤의 쇼윈도 서편. 구경하느라 모여 있는 인간들이 서쪽 입구 주변을 둘러싸고 있다.",
            barrier: {
                id: "crowd_west",
                type: "stealth",
                msg: "개 동상을 촬영하는 인간들의 스마트폰 불빛과 시선이 골목 서쪽을 차단하고 있습니다.",
                hackLabel: "기지개 켜며 인간 시선 밖으로 기어가기",
                successMsg: "인간들의 발목 사이 바짝 엎드려 조용히 기어 지나가는 데 성공했습니다.",
                failMsg: "아이쿠! 한 인간의 발등에 몸을 스쳐 비명을 지르는 바람에 모두가 당신을 쳐다봅니다.",
                difficulty: 3
            },
            image: "extracted_photos/img_4_1.png",
            mask: "extracted_masks/mask_4_1.png"
        },
        "4_2": {
            name: "백구 동상 쇼윈도 - 중앙 (Gallery Center)",
            description: "쇼윈도 안의 환한 빛 아래 사람들이 유심히 내부를 구경하고 있다. 백구 동상과 진짜 길고양이인 당신을 비교하며 흥미로워할지도.",
            barrier: null,
            image: "extracted_photos/img_4_2.png",
            mask: "extracted_masks/mask_4_2.png"
        },
        "4_3": {
            name: "백구 동상 쇼윈도 - 동쪽 (East Gallery Window)",
            description: "쇼윈도 앞 구경꾼들이 동상의 예술성을 논하고 있는 밤의 갤러리 동쪽 구역. 사람들의 틈바구니 사이를 뚫고 지나가야 한다.",
            barrier: null,
            image: "extracted_photos/img_4_3.png",
            mask: "extracted_masks/mask_4_3.png"
        },
        "4_4": {
            name: "갤러리 탈출로 (Gallery Outskirts)",
            description: "백구 동상 쇼윈도 영역의 가장자리. 조명이 닿지 않는 어둠이 시작되는 지점이자 골목의 탈출구다.",
            barrier: null,
            image: "extracted_photos/img_4_4.png",
            mask: "extracted_masks/mask_4_4.png"
        },
        "5_1": {
            name: "가로등 밑 골목 (Streetlight Alley)",
            description: "밤이 깊어 가로등 하나가 은은하게 비추고 있는 조용한 계단식 골목 아래. 남산 밑 비밀 지대로 향하는 입구다.",
            barrier: null,
            image: "extracted_photos/img_5_1.png",
            mask: "extracted_masks/mask_5_1.png"
        },
        "5_2": {
            name: "남산 루프탑 서편 (Namsan Rooftop West)",
            description: "바닥에 비가 고여 잔잔하게 하늘을 반사하고 있는 옥상 공간. 멀리 서울 시내의 흩어지는 빛들이 아름답게 연출되어 있다.",
            barrier: null,
            image: "extracted_photos/img_5_2.png",
            mask: "extracted_masks/mask_5_2.png"
        },
        "5_3": {
            name: "옥상 전망대 (Rooftop Lookout)",
            description: "이태원 2동의 붉은 벽돌 주택들과 남산 소월로가 한눈에 내려다보이는 최고의 전망대. 해방촌 너머 도시의 불빛들이 별처럼 흩어져 반짝인다.",
            barrier: null,
            image: "extracted_photos/img_5_3.png",
            mask: "extracted_masks/mask_5_3.png"
        },
        "5_4": {
            name: "남산 밤의 계단길 [최종 목적지] (Secret Staircase)",
            description: "양옆에 굳건한 옹벽과 펜스가 쳐진 가파른 하늘 계단. 이 좁고 깊은 밤의 계단을 정복하여 통과하면 남산의 숲속 고양이 제국으로 완벽하게 탈출할 수 있습니다! [최종 목적지]",
            barrier: {
                id: "final_escape",
                type: "hack",
                msg: "남산 계단 꼭대기에 주민들이 쳐둔 철제 차단망이 빈틈없이 닫혀 있습니다.",
                hackLabel: "고양이의 민첩한 도약 (최종 관문 탈출)",
                successMsg: "벽면에 단숨에 발을 딛고 펜스의 틈새로 솟구쳐 올랐습니다! 바람 소리와 함께 남산으로 향하는 고양이길이 해킹되어 열립니다!",
                failMsg: "몸이 무거워 차단망 꼭대기에 닿지 못하고 내려앉았습니다. 몸을 추스르고 다시 뛰어보세요.",
                difficulty: 5
            },
            image: "extracted_photos/img_5_4.png",
            mask: "extracted_masks/mask_5_4.png"
        }
    }
};
