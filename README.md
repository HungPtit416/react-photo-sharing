# Photo Sharing Application

Ứng dụng chia sẻ ảnh được xây dựng bằng React, cho phép người dùng xem và chia sẻ ảnh với nhau.

## Tính năng

- Đăng ký và đăng nhập tài khoản
- Xem danh sách người dùng
- Xem thông tin chi tiết người dùng
- Xem bộ sưu tập ảnh của người dùng
- Thêm bình luận cho ảnh
- Cập nhật ảnh mới real-time (Server-Sent Events)
- Hiển thị số người dùng online (WebSocket)

## Công nghệ sử dụng

- React 18
- Material-UI
- React Router
- Axios
- WebSocket & Server-Sent Events

## Cài đặt

```bash
npm install
```

## Chạy ứng dụng

```bash
npm start
```

Mở trình duyệt tại: http://localhost:3000

## Build production

```bash
npm run build
```

## Cấu trúc thư mục

```
src/
  components/       Các component chính
    LoginRegister/  Đăng nhập và đăng ký
    UserList/       Danh sách người dùng
    UserDetail/     Thông tin người dùng
    UserPhotos/     Bộ sưu tập ảnh
    UserHome/       Trang chủ người dùng
    TopBar/         Thanh điều hướng
  hooks/           Custom hooks
  lib/             Thư viện và utilities
  modelData/       Dữ liệu mẫu
```

## Yêu cầu

- Node.js phiên bản 14 trở lên
- Backend API server đang chạy

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
