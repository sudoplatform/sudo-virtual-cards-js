export const uuidV4Regex = (prefix?: string): RegExp => {
  if (prefix) {
    return new RegExp(
      `^${prefix}-[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$`,
      'i',
    )
  } else {
    return new RegExp(
      /^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i,
    )
  }
}
