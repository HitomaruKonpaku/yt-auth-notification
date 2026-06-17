import { decodePostParams } from './params-parser';

describe('decodePostParams', () => {
  // Known examples from real notification data — add to this array
  const KNOWN_PARAMS = [
    { params: 'wgNcEhhVQ0lqZGZqY1NhRWdkandiZ2p4QzNaV2caJFVna3g1WGwyNE9kZmZHTDVsMlVlSE9XZ1hfR3QtZFNZQmlIdiACWhhVQ0lqZGZqY1NhRWdkandiZ2p4QzNaV2c%3D', post_id: 'Ugkx5Xl24OdffGL5l2UeHOWgX_Gt-dSYBiHv', channel_id: 'UCIjdfjcSaEgdjwbgjxC3ZWg' },
    { params: 'wgNcEhhVQ3lMR2NxWXM3UnNCYjNMMFNKZnpHWUEaJFVna3hwVFRKN2ZUMUVXOW9ad3F5NWVqalpEdThRY2pfbjh3VCACWhhVQ3lMR2NxWXM3UnNCYjNMMFNKZnpHWUE%3D', post_id: 'UgkxpTTJ7fT1EW9oZwqy5ejjZDu8Qcj_n8wT', channel_id: 'UCyLGcqYs7RsBb3L0SJfzGYA' },
    { params: 'wgNcEhhVQ252Vkc5UmJPVzNKNklmcW8tektMaXcaJFVna3hKWEctRkdJZ19rVG0zdFRPY09NbTBmNzYzckRNMnlGTyACWhhVQ252Vkc5UmJPVzNKNklmcW8tektMaXc%3D', post_id: 'UgkxJXG-FGIg_kTm3tTOcOMm0f763rDM2yFO', channel_id: 'UCnvVG9RbOW3J6Ifqo-zKLiw' },
    { params: 'wgNcEhhVQ0lqZGZqY1NhRWdkandiZ2p4QzNaV2caJFVna3hVZ1pieTJXYkdoQnhzWTUtbmd3WkEza1RVOXVzTllReSACWhhVQ0lqZGZqY1NhRWdkandiZ2p4QzNaV2c%3D', post_id: 'UgkxUgZby2WbGhBxsY5-ngwZA3kTU9usNYQy', channel_id: 'UCIjdfjcSaEgdjwbgjxC3ZWg' },
    { params: 'wgNcEhhVQ1NVdTFsaWgyUmlmV2tLdERPSmRzQkEaJFVna3h1SHo5Zm80Q3ZCNjdaaEtoU3M5eGtLaUdQWUZranJOMiACWhhVQ1NVdTFsaWgyUmlmV2tLdERPSmRzQkE%3D', post_id: 'UgkxuHz9fo4CvB67ZhKhSs9xkKiGPYFkjrN2', channel_id: 'UCSUu1lih2RifWkKtDOJdsBA' },
    { params: 'wgNcEhhVQ1NVdTFsaWgyUmlmV2tLdERPSmRzQkEaJFVna3hfdU5RckxNeHdjWXFySXk3SkRMRVgwMUhva2JHbWphNCACWhhVQ1NVdTFsaWgyUmlmV2tLdERPSmRzQkE%3D', post_id: 'Ugkx_uNQrLMxwcYqrIy7JDLEX01HokbGmja4', channel_id: 'UCSUu1lih2RifWkKtDOJdsBA' },
    { params: 'wgNcEhhVQ1NVdTFsaWgyUmlmV2tLdERPSmRzQkEaJFVna3g4VGZFeHlCdzR1aFI2NWktUHd5RURlekMzVnRSQ09oXyACWhhVQ1NVdTFsaWgyUmlmV2tLdERPSmRzQkE%3D', post_id: 'Ugkx8TfExyBw4uhR65i-PwyEDezC3VtRCOh_', channel_id: 'UCSUu1lih2RifWkKtDOJdsBA' },
    { params: 'wgNcEhhVQ252Vkc5UmJPVzNKNklmcW8tektMaXcaJFVna3gyUnNMaDY2Mi0zT0l0T1ZrbU41WlVONnNQRFJjaHN6TyACWhhVQ252Vkc5UmJPVzNKNklmcW8tektMaXc%3D', post_id: 'Ugkx2RsLh662-3OItOVkmN5ZUN6sPDRchszO', channel_id: 'UCnvVG9RbOW3J6Ifqo-zKLiw' },
    { params: 'wgNcEhhVQ1NVdTFsaWgyUmlmV2tLdERPSmRzQkEaJFVna3hoTG41NWprUXFVZ2lmWHFwTjZuWjlKaFpYZXU4dTEyeCACWhhVQ1NVdTFsaWgyUmlmV2tLdERPSmRzQkE%3D', post_id: 'UgkxhLn55jkQqUgifXqpN6nZ9JhZXeu8u12x', channel_id: 'UCSUu1lih2RifWkKtDOJdsBA' },
    { params: 'wgNcEhhVQ192TVlXY0RqbWZkcEg2cjRUVG4xTVEaJFVna3hYcGhwV1VZVlhXdnBWeEpSRlBxcnQ0amNRQjQySlA1RSACWhhVQ192TVlXY0RqbWZkcEg2cjRUVG4xTVE%3D', post_id: 'UgkxXphpWUYVXWvpVxJRFPqrt4jcQB42JP5E', channel_id: 'UC_vMYWcDjmfdpH6r4TTn1MQ' },
    { params: 'wgNcEhhVQ1NVdTFsaWgyUmlmV2tLdERPSmRzQkEaJFVna3h5Si1TYkYwM3JBdlRRYTRQNENXdXNuckdFWTN0cmlOZyACWhhVQ1NVdTFsaWgyUmlmV2tLdERPSmRzQkE%3D', post_id: 'UgkxyJ-SbF03rAvTQa4P4CWusnrGEY3triNg', channel_id: 'UCSUu1lih2RifWkKtDOJdsBA' },
    { params: 'wgNcEhhVQ0lqZGZqY1NhRWdkandiZ2p4QzNaV2caJFVna3hkRDBIV2FhMnVQZHVfbUxYXzhlVUJrOV8wcjhLOVp0QyACWhhVQ0lqZGZqY1NhRWdkandiZ2p4QzNaV2c%3D', post_id: 'UgkxdD0HWaa2uPdu_mLX_8eUBk9_0r8K9ZtC', channel_id: 'UCIjdfjcSaEgdjwbgjxC3ZWg' },
    { params: 'wgNcEhhVQ1NVdTFsaWgyUmlmV2tLdERPSmRzQkEaJFVna3gxMkg2Q1hKTTV0YjFRS0dVYlNMN3BIZEtYeXpWeE1ZaSACWhhVQ1NVdTFsaWgyUmlmV2tLdERPSmRzQkE%3D', post_id: 'Ugkx12H6CXJM5tb1QKGUbSL7pHdKXyzVxMYi', channel_id: 'UCSUu1lih2RifWkKtDOJdsBA' },
    { params: 'wgNcEhhVQ1NVdTFsaWgyUmlmV2tLdERPSmRzQkEaJFVna3g5ejlnazR3R2ZScWVGUFNGTnhJWDdXdFR4YU1nWENlVyACWhhVQ1NVdTFsaWgyUmlmV2tLdERPSmRzQkE%3D', post_id: 'Ugkx9z9gk4wGfRqeFPSFNxIX7WtTxaMgXCeW', channel_id: 'UCSUu1lih2RifWkKtDOJdsBA' },
    { params: 'wgNcEhhVQzF1djJPcTZrTnhnQVRsQ2llejU5aHcaJFVna3g3Z1ZjcXl3Y3BaNHdlM1oydlJSZUZhbmZsaUNfZTBQRyACWhhVQzF1djJPcTZrTnhnQVRsQ2llejU5aHc%3D', post_id: 'Ugkx7gVcqywcpZ4we3Z2vRReFanfliC_e0PG', channel_id: 'UC1uv2Oq6kNxgATlCiez59hw' },
    { params: 'wgNcEhhVQ1NVdTFsaWgyUmlmV2tLdERPSmRzQkEaJFVna3hJbkxQWUtuWWRnV2FscEVRdEJnaGV6Qm9zenlXZ0xrdSACWhhVQ1NVdTFsaWgyUmlmV2tLdERPSmRzQkE%3D', post_id: 'UgkxInLPYKnYdgWalpEQtBghezBoszyWgLku', channel_id: 'UCSUu1lih2RifWkKtDOJdsBA' },
    { params: 'wgNcEhhVQ1NVdTFsaWgyUmlmV2tLdERPSmRzQkEaJFVna3h0UG1KOEtDNDRhNnNtbkFIT05mWXdSVlotZmF6Y2RpaSACWhhVQ1NVdTFsaWgyUmlmV2tLdERPSmRzQkE%3D', post_id: 'UgkxtPmJ8KC44a6smnAHONfYwRVZ-fazcdii', channel_id: 'UCSUu1lih2RifWkKtDOJdsBA' },
    { params: 'wgNcEhhVQ1NVdTFsaWgyUmlmV2tLdERPSmRzQkEaJFVna3hsU2xtc3dNWWY1eWtINy1yTUdhanBjcUVycndWM0ZNViACWhhVQ1NVdTFsaWgyUmlmV2tLdERPSmRzQkE%3D', post_id: 'UgkxlSlmswMYf5ykH7-rMGajpcqErrwV3FMV', channel_id: 'UCSUu1lih2RifWkKtDOJdsBA' },
    { params: 'wgNcEhhVQzVDd2FNbDFlSWdZOGgwMnVadzd1OEEaJFVna3hmQzFsNmpRVmU1dTBlS0JVM01VTkZJV0tVMlh6dGsyRiACWhhVQzVDd2FNbDFlSWdZOGgwMnVadzd1OEE%3D', post_id: 'UgkxfC1l6jQVe5u0eKBU3MUNFIWKU2Xztk2F', channel_id: 'UC5CwaMl1eIgY8h02uZw7u8A' },
    { params: 'wgNcEhhVQ1NVdTFsaWgyUmlmV2tLdERPSmRzQkEaJFVna3hfWkl6dXl0VXcxSl9hdG5OZ2h2T21IYzAwQlVRcXRzUCACWhhVQ1NVdTFsaWgyUmlmV2tLdERPSmRzQkE%3D', post_id: 'Ugkx_ZIzuytUw1J_atnNghvOmHc00BUQqtsP', channel_id: 'UCSUu1lih2RifWkKtDOJdsBA' },
    { params: 'wgNcEhhVQ1JKVl8xYVY0YVpqRkFFVW42bzVhcncaJFVna3hyMWpQdlJJTTVZWUcyN29DVnV6SzlyTlBwdl9XMnJMVCACWhhVQ1JKVl8xYVY0YVpqRkFFVW42bzVhcnc%3D', post_id: 'Ugkxr1jPvRIM5YYG27oCVuzK9rNPpv_W2rLT', channel_id: 'UCRJV_1aV4aZjFAEUn6o5arw' },
    { params: 'wgNcEhhVQ1JKVl8xYVY0YVpqRkFFVW42bzVhcncaJFVna3hmYTlsOXVxR1lkcnJzN19CbXhFcmVSWVR1XzRJNzFSTSACWhhVQ1JKVl8xYVY0YVpqRkFFVW42bzVhcnc%3D', post_id: 'Ugkxfa9l9uqGYdrrs7_BmxEreRYTu_4I71RM', channel_id: 'UCRJV_1aV4aZjFAEUn6o5arw' },
    { params: 'wgNcEhhVQ0lqZGZqY1NhRWdkandiZ2p4QzNaV2caJFVna3hBaUM3Y0JwcmsySEtxMjN1NjRNUjNLcWFVV2tmVjJKNCACWhhVQ0lqZGZqY1NhRWdkandiZ2p4QzNaV2c%3D', post_id: 'UgkxAiC7cBprk2HKq23u64MR3KqaUWkfV2J4', channel_id: 'UCIjdfjcSaEgdjwbgjxC3ZWg' },
    { params: 'wgNcEhhVQ1NVdTFsaWgyUmlmV2tLdERPSmRzQkEaJFVna3hxQ19JQnhNM1ZlRmYybVJZa05WdkhQNmlRMDMxRmpBZSACWhhVQ1NVdTFsaWgyUmlmV2tLdERPSmRzQkE%3D', post_id: 'UgkxqC_IBxM3VeFf2mRYkNVvHP6iQ031FjAe', channel_id: 'UCSUu1lih2RifWkKtDOJdsBA' },
    { params: 'wgNcEhhVQ1NVdTFsaWgyUmlmV2tLdERPSmRzQkEaJFVna3hqTjZJZ21PeFduTGxhNTQ1NWJ0cGxYWmFMNGZqSFZJaiACWhhVQ1NVdTFsaWgyUmlmV2tLdERPSmRzQkE%3D', post_id: 'UgkxjN6IgmOxWnLla5455btplXZaL4fjHVIj', channel_id: 'UCSUu1lih2RifWkKtDOJdsBA' },
    { params: 'wgNcEhhVQ1NVdTFsaWgyUmlmV2tLdERPSmRzQkEaJFVna3hBSmVIWG1fVl9wbkxOMUxQZ1U0aWx1Vlh0Y3Q0SXpYTSACWhhVQ1NVdTFsaWgyUmlmV2tLdERPSmRzQkE%3D', post_id: 'UgkxAJeHXm_V_pnLN1LPgU4iluVXtct4IzXM', channel_id: 'UCSUu1lih2RifWkKtDOJdsBA' },
    { params: 'wgNcEhhVQ1NVdTFsaWgyUmlmV2tLdERPSmRzQkEaJFVna3g0Rm1BSXpXUndEZ1BMcHNlRW5JSEJnZjZibk5sQ1VFUiACWhhVQ1NVdTFsaWgyUmlmV2tLdERPSmRzQkE%3D', post_id: 'Ugkx4FmAIzWRwDgPLpseEnIHBgf6bnNlCUER', channel_id: 'UCSUu1lih2RifWkKtDOJdsBA' },
    { params: 'wgNcEhhVQ1NVdTFsaWgyUmlmV2tLdERPSmRzQkEaJFVna3g4STlWT3ZsQVVQUnhkNkJIbFFhX0lZQm45eHVXNVRhWSACWhhVQ1NVdTFsaWgyUmlmV2tLdERPSmRzQkE%3D', post_id: 'Ugkx8I9VOvlAUPRxd6BHlQa_IYBn9xuW5TaY', channel_id: 'UCSUu1lih2RifWkKtDOJdsBA' },
    { params: 'wgNcEhhVQ1NVdTFsaWgyUmlmV2tLdERPSmRzQkEaJFVna3h6a2FNbmN5RmxxTkM3ak5JNnpHaGx0cDdVOUVXYTVxRiACWhhVQ1NVdTFsaWgyUmlmV2tLdERPSmRzQkE%3D', post_id: 'UgkxzkaMncyFlqNC7jNI6zGhltp7U9EWa5qF', channel_id: 'UCSUu1lih2RifWkKtDOJdsBA' },
    { params: 'wgNcEhhVQ1NVdTFsaWgyUmlmV2tLdERPSmRzQkEaJFVna3hqblJKMWJVV1ozVzZpNllGX0NCS3NSTGNfMF9SX0NMMiACWhhVQ1NVdTFsaWgyUmlmV2tLdERPSmRzQkE%3D', post_id: 'UgkxjnRJ1bUWZ3W6i6YF_CBKsRLc_0_R_CL2', channel_id: 'UCSUu1lih2RifWkKtDOJdsBA' },
    { params: 'wgNcEhhVQ1NVdTFsaWgyUmlmV2tLdERPSmRzQkEaJFVna3h5WFV6YjFUU0dyMGsxQ0hhd1dzSVBVcTVtak9IeHl2YyACWhhVQ1NVdTFsaWgyUmlmV2tLdERPSmRzQkE%3D', post_id: 'UgkxyXUzb1TSGr0k1CHawWsIPUq5mjOHxyvc', channel_id: 'UCSUu1lih2RifWkKtDOJdsBA' },
    { params: 'wgNcEhhVQ252Vkc5UmJPVzNKNklmcW8tektMaXcaJFVna3hqWlg2VHFrZlR6SkpaU1ltNEFmVi1jZVNJSEFMTVZMTyACWhhVQ252Vkc5UmJPVzNKNklmcW8tektMaXc%3D', post_id: 'UgkxjZX6TqkfTzJJZSYm4AfV-ceSIHALMVLO', channel_id: 'UCnvVG9RbOW3J6Ifqo-zKLiw' },
    { params: 'wgNcEhhVQ1NVdTFsaWgyUmlmV2tLdERPSmRzQkEaJFVna3hlZG9vVVlRR0o2OXpwUUxNN1dXendlRm9BM2ZyeVBFNSACWhhVQ1NVdTFsaWgyUmlmV2tLdERPSmRzQkE%3D', post_id: 'UgkxedooUYQGJ69zpQLM7WWzweFoA3fryPE5', channel_id: 'UCSUu1lih2RifWkKtDOJdsBA' },
    { params: 'wgNcEhhVQ1NVdTFsaWgyUmlmV2tLdERPSmRzQkEaJFVna3hjb3JNalVXT0NfMXk5TTZHbUdQdmJYQ0RDd1NPWC05QyACWhhVQ1NVdTFsaWgyUmlmV2tLdERPSmRzQkE%3D', post_id: 'UgkxcorMjUWOC_1y9M6GmGPvbXCDCwSOX-9C', channel_id: 'UCSUu1lih2RifWkKtDOJdsBA' },
    { params: 'wgNcEhhVQ1NVdTFsaWgyUmlmV2tLdERPSmRzQkEaJFVna3hnenVQb090TF8zTjZOV1hucndYakhEMW5IdzFSMnFkcCACWhhVQ1NVdTFsaWgyUmlmV2tLdERPSmRzQkE%3D', post_id: 'UgkxgzuPoOtL_3N6NWXnrwXjHD1nHw1R2qdp', channel_id: 'UCSUu1lih2RifWkKtDOJdsBA' },
  ];

  it.each(KNOWN_PARAMS)('should decode channel_id and post_id from valid params', ({ params, post_id, channel_id }) => {
    const result = decodePostParams(params);
    expect(result).not.toBeNull();
    expect(result!.post_id).toBe(post_id);
    expect(result!.channel_id).toBe(channel_id);
  });

  it('should return null for null input', () => {
    expect(decodePostParams(null as any)).toBeNull();
  });

  it('should return null for undefined input', () => {
    expect(decodePostParams(undefined as any)).toBeNull();
  });

  it('should return null for empty string', () => {
    expect(decodePostParams('')).toBeNull();
  });

  it('should return null for invalid base64', () => {
    expect(decodePostParams('!!!invalid!!!')).toBeNull();
  });

  it('should return null for base64 data without expected fields', () => {
    // 'hello' in base64
    expect(decodePostParams('aGVsbG8=')).toBeNull();
  });
});
