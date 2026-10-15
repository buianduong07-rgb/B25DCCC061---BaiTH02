export interface City {
  id: string;
  name: string;
  lat: number;
  lon: number;
}

export const CITIES: City[] = [
  { id: "hanoi", name: "Hà Nội", lat: 21.0285, lon: 105.8542 },
  { id: "haiphong", name: "Hải Phòng", lat: 20.8449, lon: 106.6881 },
  { id: "hue", name: "Huế", lat: 16.4637, lon: 107.5909 },
  { id: "danang", name: "Đà Nẵng", lat: 16.0544, lon: 108.2022 },
  { id: "nhatrang", name: "Nha Trang", lat: 12.2388, lon: 109.1967 },
  { id: "dalat", name: "Đà Lạt", lat: 11.9404, lon: 108.4583 },
  { id: "hcm", name: "TP. Hồ Chí Minh", lat: 10.8231, lon: 106.6297 },
  { id: "cantho", name: "Cần Thơ", lat: 10.0452, lon: 105.7469 },
];
