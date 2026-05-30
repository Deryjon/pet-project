export function resolveMeasurementUnitLabel(item: any, fallback = "шт") {
  return String(
    item?.measurementUnitLabel ??
      item?.measurement_unit_label ??
      item?.measurement_unit?.short_name ??
      item?.measurement_unit?.name ??
      item?.product?.measurement_unit?.short_name ??
      item?.product?.measurement_unit?.name ??
      item?.measurement_unit_short_name ??
      item?.measurement_unit_name ??
      item?.measurement_type ??
      item?.product?.measurement_type ??
      item?.unit ??
      fallback,
  ).trim() || fallback;
}

export function resolveFormMeasurementUnitLabel(form: any, fallback = "шт") {
  return String(
    form?.measurement_unit_short_name ??
      form?.measurement_unit_name ??
      form?.measurement_unit?.short_name ??
      form?.measurement_unit?.name ??
      form?.measurement_type ??
      form?.unit ??
      fallback,
  ).trim() || fallback;
}
