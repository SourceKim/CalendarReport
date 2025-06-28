<template>
  <div class="calendar-report">
    <!-- 顶部导航栏 -->
    <el-header class="header">
      <h1>一键生成周报</h1>
    </el-header>

    <!-- 主体内容 -->
    <el-main class="main-content">
      <!-- 日历部分 -->
      <div class="calendar-section">
        <!-- 日历操作栏 -->
        <div class="calendar-controls">
          <el-date-picker
            v-model="currentDate"
            type="month"
            placeholder="选择年月"
            format="YYYY年MM月"
            value-format="YYYY-MM"
            @change="handleMonthChange"
          />
        </div>

        <!-- 日历组件 -->
        <el-calendar v-model="selectedDate" class="calendar">
          <template #date-cell="{ data }">
            <div 
              class="calendar-cell"
              :class="{ 'has-report': hasReportOnDate(data.day) }"
              @click="openReportDialog(data.day)"
            >
              <span class="date-text">{{ data.day.split('-')[2] }}</span>
              <div v-if="hasReportOnDate(data.day)" class="report-indicator"></div>
            </div>
          </template>
        </el-calendar>
      </div>

      <!-- 底部周报生成区域 -->
      <div class="weekly-section">
        <div class="date-range-picker">
          <el-date-picker
            v-model="weeklyDateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            format="YYYY/MM/DD"
            value-format="YYYY-MM-DD"
            :shortcuts="dateShortcuts"
          />
        </div>
        
        <el-button 
          type="primary" 
          size="large"
          :loading="isGenerating"
          @click="generateWeeklyReport"
          class="generate-btn"
        >
          {{ isGenerating ? '生成中...' : '一键生成周报' }}
        </el-button>
      </div>
    </el-main>

    <!-- 日报编辑弹窗 -->
    <el-dialog
      v-model="reportDialogVisible"
      :title="reportDialogTitle"
      width="90%"
      :close-on-click-modal="true"
      class="report-dialog"
    >
      <el-input
        v-model="currentReportContent"
        type="textarea"
        :rows="6"
        placeholder="请输入今日日报内容..."
        class="report-input"
      />
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="reportDialogVisible = false">取消</el-button>
          <el-button 
            v-if="currentReportContent || getReportByDate(selectedReportDate)"
            type="danger"
            @click="deleteCurrentReport"
          >
            删除
          </el-button>
          <el-button 
            type="primary" 
            @click="saveCurrentReport"
            :disabled="!currentReportContent.trim()"
          >
            保存
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 周报显示弹窗 -->
    <el-dialog
      v-model="weeklyReportDialogVisible"
      title="生成的周报"
      width="90%"
      class="weekly-report-dialog"
    >
      <div class="weekly-report-content">
        <el-input
          v-model="generatedWeeklyReport"
          type="textarea"
          :rows="10"
          readonly
          class="weekly-report-text"
        />
      </div>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="weeklyReportDialogVisible = false">关闭</el-button>
          <el-button type="primary" @click="copyWeeklyReport">复制内容</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'
import { useDailyReportStore } from '../stores/dailyReport'
import { cozeService } from '../utils/coze.utils'

const reportStore = useDailyReportStore()

// 日历相关状态
const currentDate = ref(dayjs().format('YYYY-MM'))
const selectedDate = ref(new Date())

// 日报弹窗相关状态
const reportDialogVisible = ref(false)
const selectedReportDate = ref('')
const currentReportContent = ref('')

// 周报生成相关状态
const weeklyDateRange = ref<[string, string]>(['', ''])
const isGenerating = ref(false)
const weeklyReportDialogVisible = ref(false)
const generatedWeeklyReport = ref('')

// 日期快捷选项
const dateShortcuts = [
  {
    text: '本周',
    value: () => {
      const today = dayjs()
      const start = today.startOf('week').add(1, 'day') // 周一开始
      const end = today.endOf('week').add(1, 'day') // 周日结束
      return [start.format('YYYY-MM-DD'), end.format('YYYY-MM-DD')]
    }
  },
  {
    text: '上周',
    value: () => {
      const today = dayjs()
      const start = today.subtract(1, 'week').startOf('week').add(1, 'day')
      const end = today.subtract(1, 'week').endOf('week').add(1, 'day')
      return [start.format('YYYY-MM-DD'), end.format('YYYY-MM-DD')]
    }
  },
  {
    text: '最近7天',
    value: () => {
      const today = dayjs()
      const start = today.subtract(6, 'day')
      return [start.format('YYYY-MM-DD'), today.format('YYYY-MM-DD')]
    }
  }
]

// 计算属性
const reportDialogTitle = computed(() => {
  return selectedReportDate.value ? `编辑日报 - ${dayjs(selectedReportDate.value).format('YYYY年MM月DD日')}` : '编辑日报'
})

// 检查指定日期是否有日报
const hasReportOnDate = (date: string) => {
  return reportStore.hasReport(date)
}

// 获取指定日期的日报
const getReportByDate = (date: string) => {
  return reportStore.getReport(date)
}

// 处理月份变化
const handleMonthChange = (value: string) => {
  if (value) {
    const date = dayjs(value).toDate()
    selectedDate.value = date
  }
}

// 打开日报编辑弹窗
const openReportDialog = (date: string) => {
  selectedReportDate.value = date
  const existingReport = getReportByDate(date)
  currentReportContent.value = existingReport?.content || ''
  reportDialogVisible.value = true
}

// 保存当前日报
const saveCurrentReport = () => {
  if (!currentReportContent.value.trim()) {
    ElMessage.warning('请输入日报内容')
    return
  }
  
  reportStore.saveReport(selectedReportDate.value, currentReportContent.value.trim())
  ElMessage.success('日报保存成功')
  reportDialogVisible.value = false
  currentReportContent.value = ''
}

// 删除当前日报
const deleteCurrentReport = () => {
  reportStore.deleteReport(selectedReportDate.value)
  ElMessage.success('日报删除成功')
  reportDialogVisible.value = false
  currentReportContent.value = ''
}

// 生成周报
const generateWeeklyReport = async () => {
  if (!weeklyDateRange.value[0] || !weeklyDateRange.value[1]) {
    ElMessage.error('请选择完整的日期区间')
    return
  }
  
  const [startDate, endDate] = weeklyDateRange.value
  
  if (dayjs(endDate).isBefore(dayjs(startDate))) {
    ElMessage.error('结束日期必须晚于开始日期')
    return
  }
  
  const reportsInRange = reportStore.getReportsInRange(startDate, endDate)
  
  if (reportsInRange.length === 0) {
    ElMessage.warning('选定日期区间内没有日报记录')
    return
  }
  
  isGenerating.value = true
  
  try {
    // 调用真实的 Coze API
    const weeklyContent = await cozeService.generateWeeklyReport(
      reportsInRange, 
      { start: startDate, end: endDate }
    )
    generatedWeeklyReport.value = weeklyContent
    weeklyReportDialogVisible.value = true
  } catch (error) {
    ElMessage.error('生成周报失败，请稍后重试')
    console.error('Generate weekly report error:', error)
  } finally {
    isGenerating.value = false
  }
}



// 复制周报内容
const copyWeeklyReport = () => {
  navigator.clipboard.writeText(generatedWeeklyReport.value).then(() => {
    ElMessage.success('周报内容已复制到剪贴板')
  }).catch(() => {
    ElMessage.error('复制失败，请手动复制')
  })
}

onMounted(() => {
  // 初始化本周日期范围
  const today = dayjs()
  const start = today.startOf('week').add(1, 'day')
  const end = today.endOf('week').add(1, 'day')
  weeklyDateRange.value = [start.format('YYYY-MM-DD'), end.format('YYYY-MM-DD')]
})
</script>

<style scoped>
.calendar-report {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.header {
  background: #409eff;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 60px;
  padding: 0;
}

.header h1 {
  margin: 0;
  font-size: 20px;
  font-weight: 500;
}

.main-content {
  flex: 1;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  overflow-y: auto;
}

.calendar-section {
  flex: 1;
}

.calendar-controls {
  margin-bottom: 15px;
  display: flex;
  justify-content: center;
}

.calendar {
  width: 100%;
}

.calendar-cell {
  position: relative;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.calendar-cell:hover {
  background-color: #f5f7fa;
}

.calendar-cell.has-report {
  background-color: #e1f3d8;
}

.calendar-cell.has-report:hover {
  background-color: #d4eda1;
}

.date-text {
  font-size: 14px;
}

.report-indicator {
  position: absolute;
  top: 2px;
  right: 2px;
  width: 6px;
  height: 6px;
  background-color: #67c23a;
  border-radius: 50%;
}

.weekly-section {
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 15px;
  align-items: center;
}

.date-range-picker {
  width: 100%;
  max-width: 400px;
}

.generate-btn {
  width: 100%;
  max-width: 300px;
  height: 45px;
  font-size: 16px;
}

.report-dialog .report-input {
  margin-bottom: 20px;
}

.dialog-footer {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.weekly-report-content {
  margin-bottom: 20px;
}

.weekly-report-text {
  font-family: 'Courier New', monospace;
  line-height: 1.6;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .main-content {
    padding: 10px;
  }
  
  .calendar-controls {
    margin-bottom: 10px;
  }
  
  .weekly-section {
    padding: 15px;
  }
  
  .header h1 {
    font-size: 18px;
  }
  
  .calendar-cell {
    height: 35px;
  }
  
  .date-text {
    font-size: 12px;
  }
  
  .report-dialog,
  .weekly-report-dialog {
    width: 95% !important;
  }
}
</style> 