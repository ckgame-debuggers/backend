export const verifyEmailTemplate = `
<table
    style="
    background-color: rgb(28, 29, 32);
    width: 100%;
    padding: 4rem 2rem;
    font-family: Pretendard, 'Arial';
    color: rgb(223, 223, 223);
    word-break: keep-all;
    "
>
    <tbody style="display: flex; flex-direction: column; gap: 1rem">
    <tr>
        <td style="font-size: 25px; font-weight: 700; padding-bottom: 2rem; color: white">
        이메일을 인증하세요.
        </td>
    </tr>
    <tr
        style="
        display: flex;
        flex-direction: column;
        font-size: 18px;
        gap: 1rem;
        padding-bottom: 1rem;
        "
    >
        <td style="color: white">
        이 이메일은 디버거즈(청강문화산업대학교 게임스쿨 학생회) 웹 서비스
        회원가입을 위해 발송되었습니다.
        </td>
        <td style="color: white">
        혹시라도 이 이메일이 왜 발송되었는지 모르시거나, 디버거즈 웹
        서비스에 가입을 시도하신 적이 없으시다면 이 메일을 무시해 주세요.
        </td>
    </tr>
    <tr style="margin: 1rem 0">
        <td style="display: flex; gap: 1rem">
        <a
            style="
            cursor: pointer;
            background-color: #ff700f;
            padding: 10px 40px;
            color: white;
            text-decoration: none;
            font-size: 15px;
            border-radius: 5px;
            box-sizing: border-box;
            "
            href="$link"
            >가입 진행하기</a
        >
        <a
            style="
            cursor: pointer;
            padding: 10px 40px;
            color: #ff700f;
            text-decoration: none;
            font-size: 15px;
            border-radius: 5px;
            box-sizing: border-box;
            border: 1px solid #ff700f;
            "
            href="https://ckgamelab.com/"
            >디버거즈</a
        >
        </td>
    </tr>
    <tr>
        <td style="font-size: 12px; color:white">Copyright © Since 2025 - Deuggers</td>
    </tr>
    </tbody>
</table>
`;
