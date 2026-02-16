import { Link } from "react-router";

export default function NotFound() {
  return (
    <main className="container">
      <h1>404</h1>
      <p>요청하신 페이지를 찾을 수 없습니다.</p>
      <p>
        <Link to="/" prefetch="viewport" viewTransition>
          홈으로 이동
        </Link>
      </p>
    </main>
  );
}
