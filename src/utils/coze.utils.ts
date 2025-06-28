import { CozeAPI, ChatEventType, ChatStatus, COZE_CN_BASE_URL, RoleType } from '@coze/api';
import { COZE_CONFIG } from '../config';

// 日报接口类型定义
interface DailyReport {
  date: string;
  content: string;
}

// Coze API 工具类
export class CozeAPIService {
  private client: CozeAPI;
  private botId: string;

  constructor() {
    // 验证必要的配置
    if (!COZE_CONFIG.token) {
      throw new Error('Coze API Token 未配置');
    }
    if (!COZE_CONFIG.botId) {
      throw new Error('Coze Bot ID 未配置');
    }

    this.botId = COZE_CONFIG.botId;
    this.client = new CozeAPI({
      baseURL: COZE_CONFIG.baseURL,
      token: COZE_CONFIG.token,
      allowPersonalAccessTokenInBrowser: true
    });
  }

  /**
   * 生成周报内容
   * @param reports 日报数组
   * @param dateRange 日期范围
   * @returns 生成的周报内容
   */
  async generateWeeklyReport(reports: DailyReport[], dateRange: { start: string; end: string }): Promise<string> {
    try {
      // 构造提示词
      const prompt = this.buildWeeklyReportPrompt(reports, dateRange);
      
      // 调用 Coze API
      const response = await this.callCozeAPI(prompt);
      
      return response;
    } catch (error) {
      console.error('生成周报失败:', error);
      throw new Error('生成周报失败，请检查网络连接或稍后重试');
    }
  }

  /**
   * 构造周报生成提示词
   */
  private buildWeeklyReportPrompt(reports: DailyReport[], dateRange: { start: string; end: string }): string {
    const reportDetails = reports.map(report => 
      `- ${report.date}：「${report.content}」`
    ).join('\n');

    return `请根据以下日报内容，生成一份专业的周报总结：

时间范围：${dateRange.start} 至 ${dateRange.end}

日报详情：
${reportDetails}

请按以下格式生成周报：
1. 本周工作总结
2. 主要完成事项
3. 遇到的问题及解决方案
4. 下周工作计划
5. 其他需要关注的事项

要求：
- 内容简洁明了，重点突出
- 逻辑清晰，条理分明
- 突出工作成果和价值
- 语言专业，适合向上级汇报`;
  }

  /**
   * 调用 Coze API
   */
  private async callCozeAPI(content: string): Promise<string> {
    try {
      const stream = await this.client.chat.stream({
        bot_id: this.botId,
        additional_messages: [
          {
            role: RoleType.User,
            content: content,
            content_type: 'text',
          },
        ],
      });

      let fullResponse = '';
      
      for await (const part of stream) {
        if (part.event === ChatEventType.CONVERSATION_MESSAGE_DELTA) {
          fullResponse += part.data.content || '';
        }
      }

      if (!fullResponse.trim()) {
        throw new Error('API 返回内容为空');
      }

      return fullResponse.trim();
    } catch (error) {
      console.error('Coze API 调用失败:', error);
      throw error;
    }
  }

  /**
   * 测试 API 连接
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.callCozeAPI('你好，请回复"连接测试成功"');
      return response.includes('连接测试成功') || response.includes('你好') || response.length > 0;
    } catch (error) {
      console.error('API 连接测试失败:', error);
      return false;
    }
  }
}

// 导出单例实例
export const cozeService = new CozeAPIService();
