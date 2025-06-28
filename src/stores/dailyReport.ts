import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import dayjs from 'dayjs'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'

dayjs.extend(isSameOrAfter)
dayjs.extend(isSameOrBefore)

// 日报数据接口
export interface DailyReport {
  date: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export const useDailyReportStore = defineStore('dailyReport', () => {
  // 状态
  const reports = ref<Map<string, DailyReport>>(new Map())

  // 计算属性
  const reportCount = computed(() => reports.value.size)
  
  const reportDates = computed(() => Array.from(reports.value.keys()).sort())

  // 保存日报
  const saveReport = (date: string, content: string) => {
    const now = dayjs().format('YYYY-MM-DD HH:mm:ss')
    const existingReport = reports.value.get(date)
    
    const report: DailyReport = {
      date,
      content: content.trim(),
      createdAt: existingReport?.createdAt || now,
      updatedAt: now
    }
    
    reports.value.set(date, report)
    
    // 保存到本地存储
    saveToLocalStorage()
  }

  // 获取日报
  const getReport = (date: string): DailyReport | undefined => {
    return reports.value.get(date)
  }

  // 检查是否有日报
  const hasReport = (date: string): boolean => {
    return reports.value.has(date)
  }

  // 删除日报
  const deleteReport = (date: string) => {
    reports.value.delete(date)
    saveToLocalStorage()
  }

  // 获取日期范围内的日报
  const getReportsInRange = (startDate: string, endDate: string): DailyReport[] => {
    const result: DailyReport[] = []
    const start = dayjs(startDate)
    const end = dayjs(endDate)
    
    for (const [date, report] of reports.value) {
      const current = dayjs(date)
      if (current.isSameOrAfter(start) && current.isSameOrBefore(end)) {
        result.push(report)
      }
    }
    
    return result.sort((a, b) => a.date.localeCompare(b.date))
  }

  // 获取所有日报
  const getAllReports = (): DailyReport[] => {
    return Array.from(reports.value.values()).sort((a, b) => a.date.localeCompare(b.date))
  }

  // 清空所有日报
  const clearAllReports = () => {
    reports.value.clear()
    saveToLocalStorage()
  }

  // 保存到本地存储
  const saveToLocalStorage = () => {
    try {
      const data = Object.fromEntries(reports.value)
      localStorage.setItem('daily-reports', JSON.stringify(data))
    } catch (error) {
      console.error('保存到本地存储失败:', error)
    }
  }

  // 从本地存储加载
  const loadFromLocalStorage = () => {
    try {
      const data = localStorage.getItem('daily-reports')
      if (data) {
        const parsed = JSON.parse(data)
        reports.value = new Map(Object.entries(parsed))
      }
    } catch (error) {
      console.error('从本地存储加载失败:', error)
    }
  }

  // 导出数据
  const exportReports = (): string => {
    const allReports = getAllReports()
    return JSON.stringify(allReports, null, 2)
  }

  // 导入数据
  const importReports = (data: string): boolean => {
    try {
      const importedReports: DailyReport[] = JSON.parse(data)
      
      // 验证数据格式
      if (!Array.isArray(importedReports)) {
        throw new Error('数据格式错误')
      }
      
      for (const report of importedReports) {
        if (!report.date || !report.content) {
          throw new Error('日报数据不完整')
        }
        reports.value.set(report.date, report)
      }
      
      saveToLocalStorage()
      return true
    } catch (error) {
      console.error('导入数据失败:', error)
      return false
    }
  }

  // 获取统计信息
  const getStatistics = () => {
    const allReports = getAllReports()
    const totalReports = allReports.length
    const thisMonthReports = allReports.filter(report => 
      dayjs(report.date).isSame(dayjs(), 'month')
    ).length
    const thisWeekReports = allReports.filter(report => 
      dayjs(report.date).isSame(dayjs(), 'week')
    ).length
    
    return {
      totalReports,
      thisMonthReports,
      thisWeekReports,
      firstReportDate: allReports[0]?.date || null,
      lastReportDate: allReports[allReports.length - 1]?.date || null
    }
  }

  // 初始化时从本地存储加载数据
  loadFromLocalStorage()

  return {
    // 状态
    reports,
    
    // 计算属性
    reportCount,
    reportDates,
    
    // 方法
    saveReport,
    getReport,
    hasReport,
    deleteReport,
    getReportsInRange,
    getAllReports,
    clearAllReports,
    exportReports,
    importReports,
    getStatistics,
    loadFromLocalStorage,
    saveToLocalStorage
  }
}) 