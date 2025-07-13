/**
 * Basic Jest setup test
 * This test ensures Jest is properly configured
 */

describe('Jest Configuration', () => {
  test('should be able to run basic tests', () => {
    expect(true).toBe(true)
  })

  test('should have access to Jest globals', () => {
    expect(describe).toBeDefined()
    expect(test).toBeDefined()
    expect(expect).toBeDefined()
  })

  test('should be able to test JavaScript functions', () => {
    const add = (a: number, b: number) => a + b
    expect(add(2, 3)).toBe(5)
  })
})
