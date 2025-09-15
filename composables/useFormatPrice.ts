export function useFormatPrice() {
    const formatPrice = (value: number | string): string => {
      if (!value) return "0";
      const num = Number(value);
      if (isNaN(num)) return String(value);
      return num.toLocaleString("ru-RU"); // 40 000 вместо 40000
    };
  
    return { formatPrice };
  }
  