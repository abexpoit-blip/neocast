/** Fee (%) added on top of the amount the user wants credited. */
export const CLIENT_FEE_PERCENT = 2;

/** Amount the user must actually pay so that `credit` lands on the balance. */
export function withFee(credit: number) {
  const fee = Math.round(credit * CLIENT_FEE_PERCENT) / 100;
  return {
    credit: Math.round(credit * 100) / 100,
    fee: Math.round(fee * 100) / 100,
    charged: Math.round((credit + fee) * 100) / 100,
  };
}
