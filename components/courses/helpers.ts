export const frequencyOptions = ["Өдөр бүр", "7 хоног бүр", "Сар бүр"];
export const durationOptions = [
  { label: "30 минут", value: 0.5 },
  { label: "1 цаг", value: 1.0 },
  { label: "1.5 цаг", value: 1.5 },
  { label: "2 цаг", value: 2.0 },
  { label: "3 цаг", value: 3.0 },
  { label: "Дурын (минут)", value: 0 },
];
export function truncateWithDots(text: string, maxLength: number) {
  if (text.length <= maxLength) {
    return text;
  }
  return text.slice(0, maxLength - 3) + " ...";
}
