// geminiService.ts
import { GoogleGenerativeAI } from '@google/generative-ai';

export interface ContentAnalysisResult {
	isAnalyzed: boolean;
	analysisResult: 'safe' | 'potentially_harmful' | 'harmful' | 'requires_review';
	confidence: number;
	detectedIssues: string[];
	summary: string;
	recommendedAction: 'dismiss' | 'review' | 'remove' | 'warn_user' | 'suspend_user';
	analysisDate: Date;
	modelUsed: string;
}

export interface PostContent {
	title: string;
	content: string;
	imageUrl?: string;
	authorName: string;
	forumTitle: string;
	reportType: string;
	reportDescription: string;
}

class GeminiService {
	private genAI: GoogleGenerativeAI;
	private model: any;

	constructor() {
		const apiKey = process.env.GEMINI_API_KEY;
		if (!apiKey) {
			throw new Error('GEMINI_API_KEY environment variable is required');
		}
		
		this.genAI = new GoogleGenerativeAI(apiKey);
		this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
	}

	async analyzeForumPost(postContent: PostContent): Promise<ContentAnalysisResult> {
		try {
			const prompt = this.buildAnalysisPrompt(postContent);
			
			const result = await this.model.generateContent(prompt);
			const response = await result.response;
			const text = response.text();
			
			return this.parseAnalysisResponse(text);
		} catch (error) {
			console.error('Error analyzing forum post with Gemini:', error);
			
			// Return a fallback analysis
			return {
				isAnalyzed: false,
				analysisResult: 'requires_review',
				confidence: 0,
				detectedIssues: ['Analysis failed'],
				summary: 'Could not analyze content due to technical issues. Manual review required.',
				recommendedAction: 'review',
				analysisDate: new Date(),
				modelUsed: 'gemini-2.0-flash-exp (failed)',
			};
		}
	}

	private buildAnalysisPrompt(postContent: PostContent): string {
		return `
You are an AI content moderator analyzing a forum post that has been reported. Please analyze the following content and provide a detailed assessment.

FORUM POST DETAILS:
- Forum: ${postContent.forumTitle}
- Author: ${postContent.authorName}
- Title: ${postContent.title}
- Content: ${postContent.content}
${postContent.imageUrl ? `- Has Image: Yes (${postContent.imageUrl})` : '- Has Image: No'}

REPORT DETAILS:
- Report Type: ${postContent.reportType}
- Report Description: ${postContent.reportDescription}

ANALYSIS CRITERIA:
Please evaluate this content for:
1. Spam or promotional content
2. Inappropriate, offensive, or harmful language
3. Harassment, bullying, or personal attacks
4. Off-topic or irrelevant content
5. Misinformation or false claims
6. Copyright violations
7. Hate speech or discrimination
8. Adult content or inappropriate material
9. Personal information sharing (doxxing)
10. Threats or violent content

Please respond in the following JSON format:
{
	"analysisResult": "safe|potentially_harmful|harmful|requires_review",
	"confidence": 0.0-1.0,
	"detectedIssues": ["list", "of", "detected", "issues"],
	"summary": "Brief summary of your analysis (max 200 characters)",
	"recommendedAction": "dismiss|review|remove|warn_user|suspend_user",
	"reasoning": "Detailed explanation of your decision"
}

GUIDELINES:
- "safe": Content is appropriate and report appears unfounded
- "potentially_harmful": Content may violate guidelines, needs human review
- "harmful": Content clearly violates guidelines
- "requires_review": Cannot make confident determination, human review needed

- "dismiss": Report is unfounded, no action needed
- "review": Human moderator should review
- "remove": Content should be removed
- "warn_user": User should receive a warning
- "suspend_user": User should be temporarily suspended

Be conservative in your analysis. When in doubt, recommend human review.
`;
	}

	private parseAnalysisResponse(responseText: string): ContentAnalysisResult {
		try {
			// Try to extract JSON from the response
			const jsonMatch = responseText.match(/\{[\s\S]*\}/);
			if (!jsonMatch) {
				throw new Error('No JSON found in response');
			}

			const parsedResponse = JSON.parse(jsonMatch[0]);
			
			// Validate the response structure
			const analysisResult = ['safe', 'potentially_harmful', 'harmful', 'requires_review'].includes(parsedResponse.analysisResult)
				? parsedResponse.analysisResult
				: 'requires_review';

			const recommendedAction = ['dismiss', 'review', 'remove', 'warn_user', 'suspend_user'].includes(parsedResponse.recommendedAction)
				? parsedResponse.recommendedAction
				: 'review';

			return {
				isAnalyzed: true,
				analysisResult,
				confidence: Math.max(0, Math.min(1, parsedResponse.confidence || 0)),
				detectedIssues: Array.isArray(parsedResponse.detectedIssues) ? parsedResponse.detectedIssues : [],
				summary: (parsedResponse.summary || 'Analysis completed').substring(0, 200),
				recommendedAction,
				analysisDate: new Date(),
				modelUsed: 'gemini-2.0-flash-exp',
			};
		} catch (error) {
			console.error('Error parsing Gemini response:', error);
			console.log('Raw response:', responseText);
			
			// Return fallback analysis
			return {
				isAnalyzed: false,
				analysisResult: 'requires_review',
				confidence: 0,
				detectedIssues: ['Parsing error'],
				summary: 'Could not parse AI analysis. Manual review required.',
				recommendedAction: 'review',
				analysisDate: new Date(),
				modelUsed: 'gemini-2.0-flash-exp (parsing failed)',
			};
		}
	}

	// Batch analysis for multiple posts (useful for bulk operations)
	async analyzeMultiplePosts(posts: PostContent[]): Promise<ContentAnalysisResult[]> {
		const analyses = await Promise.allSettled(
			posts.map(post => this.analyzeForumPost(post))
		);

		return analyses.map((result, index) => {
			if (result.status === 'fulfilled') {
				return result.value;
			} else {
				console.error(`Analysis failed for post ${index}:`, result.reason);
				return {
					isAnalyzed: false,
					analysisResult: 'requires_review' as const,
					confidence: 0,
					detectedIssues: ['Batch analysis failed'],
					summary: 'Batch analysis failed. Manual review required.',
					recommendedAction: 'review' as const,
					analysisDate: new Date(),
					modelUsed: 'gemini-2.0-flash-exp (batch failed)',
				};
			}
		});
	}
}

export default GeminiService;
