// Helper function to convert time string to minutes
export const timeToMinutes = (timeStr: string): number => {
  const parts = timeStr.trim().split(':');
  let hours = parseInt(parts[0]);
  let minutes = parseInt(parts[1].split(' ')[0]); // Handle "00 PM" format
  
  // Check if it's PM and not 12 PM
  if (timeStr.toUpperCase().includes('PM') && hours !== 12) {
    hours += 12;
  }
  // Handle 12 AM case
  else if (timeStr.toUpperCase().includes('AM') && hours === 12) {
    hours = 0;
  }
  
  return hours * 60 + minutes;
};

export const filterMerchantsByTime = (merchants: any[], startTime: string, endTime: string) => {
  console.log('Applying time filtering:', startTime, 'to', endTime);
  
  return merchants.filter(merchant => {
    if (!merchant.merchant_happy_hour || merchant.merchant_happy_hour.length === 0) {
      return false;
    }

    return merchant.merchant_happy_hour.some((hh: any) => {
      const startTimeMinutes = timeToMinutes(startTime);
      const endTimeMinutes = timeToMinutes(endTime);
      
      const hhStartMinutes = parseInt(hh.happy_hour_start.split(':')[0]) * 60 + parseInt(hh.happy_hour_start.split(':')[1]);
      const hhEndMinutes = parseInt(hh.happy_hour_end.split(':')[0]) * 60 + parseInt(hh.happy_hour_end.split(':')[1]);

      console.log(`Checking ${merchant.restaurant_name}: User time ${startTime}-${endTime} (${startTimeMinutes}-${endTimeMinutes} min) vs HH ${hh.happy_hour_start}-${hh.happy_hour_end} (${hhStartMinutes}-${hhEndMinutes} min)`);

      // Check if happy hour overlaps with user's specified time window
      return hhStartMinutes < endTimeMinutes && hhEndMinutes > startTimeMinutes;
    });
  });
};