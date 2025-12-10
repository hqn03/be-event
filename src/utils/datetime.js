export function formatDate(d) {
  return new Intl.DateTimeFormat("vi-VN").format(new Date(d));
}

export function formatTime(d) {
  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(d));
}

export function formatTimeRange(start, end) {
  return `${formatTime(start)} - ${formatTime(end)} ngày ${formatDate(start)}`;
}
