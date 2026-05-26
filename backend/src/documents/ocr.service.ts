import { Injectable } from '@nestjs/common';

@Injectable()
export class OcrService {
  process(documentId: string) {
    const odometerStart = Math.floor(Math.random() * 50000) + 40000;
    const odometerEnd = odometerStart + Math.floor(Math.random() * 300) + 50;
    const calculated = odometerEnd - odometerStart;

    const fuelStart = Math.floor(Math.random() * 30) + 30;
    const fuelIssued = Math.floor(Math.random() * 20) + 10;
    const fuelEnd = Math.floor(Math.random() * 20) + 10;
    const fuelConsumed = fuelStart + fuelIssued - fuelEnd;
    const consumptionRate = 7.2;
    const expectedConsumption = parseFloat(((calculated / 100) * consumptionRate).toFixed(1));
    const deviationPercent = Math.round(((fuelConsumed - expectedConsumption) / expectedConsumption) * 100);

    const anomalies: { type: string; severity: string; field: string; value: number; threshold: number }[] = [];
    if (Math.abs(deviationPercent) > 5) {
      anomalies.push({
        type: 'fuel_overconsumption',
        severity: 'high',
        field: 'fuel_deviation',
        value: deviationPercent,
        threshold: 5,
      });
    }

    return {
      document_id: `PL-2026-${String(Math.floor(Math.random() * 900) + 100).padStart(5, '0')}`,
      date: new Date().toISOString().split('T')[0],
      organization: "ООО 'Транс Логистик'",
      division: 'Центральный парк',
      driver: {
        name: 'Сидоров Дмитрий Михайлович',
        employee_number: '00245',
      },
      vehicle: {
        model: 'Hyundai Solaris',
        license_plate: 'С789МР',
      },
      route: 'Москва - Клин - Москва',
      mileage: {
        odometer_start: odometerStart,
        odometer_end: odometerEnd,
        calculated,
      },
      fuel: {
        start_balance: fuelStart,
        issued: fuelIssued,
        end_balance: fuelEnd,
        calculated_consumption: fuelConsumed,
        consumption_rate: consumptionRate,
        deviation_percent: deviationPercent,
      },
      working_time: {
        departure: '08:15',
        arrival: '16:42',
        total_hours: 8.45,
        downtime_hours: 1.25,
      },
      signatures: {
        driver: true,
        mechanic: false,
        dispatcher: true,
      },
      medical_check: true,
      ocr_accuracy: parseFloat((Math.random() * 10 + 88).toFixed(1)),
      anomalies,
    };
  }
}
