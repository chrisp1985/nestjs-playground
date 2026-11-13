import { Test, TestingModule } from "@nestjs/testing";
import { ScoutingReportService } from "./scouting-report.service.js";
import { ScoutingRequestMessage } from "../sqs/messages/scouting-request.message.js";
import { getRepositoryToken } from "@nestjs/typeorm";
import { ScoutingService } from "./scouting.service.js";
import { ScoutingReport } from "./entities/scouting-report.entity.js";
import { LlmService } from "../llm/llm.service.js";


describe('Scouting Report', () => {

    const analysis = {
        summary: 'Promising player',
        recommendation: 'promote' as const,
        reasons: ['High potential'],
    };

    const reports = {
        findOneBy: vi.fn(),
        save: vi.fn(),
    };

    const scouting = {
        findOne: vi.fn(),
    };

    const llm = {
        analyseScoutingReport: vi.fn(),
    };   

    let service: ScoutingReportService;

    beforeEach(async () => {
        vi.resetAllMocks();
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ScoutingReportService,
            {
                provide: getRepositoryToken(ScoutingReport),
                useValue: reports,
            },
            {
                provide: ScoutingService,
                useValue: scouting,
            },
            {
                provide: LlmService,
                useValue: llm,
            },
        ],
    }).compile();
        service = module.get(ScoutingReportService);
    });

    it('does not complete the report when LLM analysis fails', async () => {
        const error = new Error('LLM provider unavailable');

        const message: ScoutingRequestMessage = {
            reportId: "f09389ec-018c-4835-996e-406fe671b45c",
            playerNo: 123,
            requestedAt: "2026-11-12T21:35:49.248Z",
        };

        reports.findOneBy.mockResolvedValue({
            status: 'queued',
        });

        scouting.findOne.mockResolvedValue({
            playerId: 123,
            potential: 85,
            report: 'Strong technical ability',
        });

        llm.analyseScoutingReport.mockRejectedValue(error);

        await expect(
            service.process(message),
        ).rejects.toThrow('LLM provider unavailable');

        expect(reports.save).not.toHaveBeenCalled();

        expect(scouting.findOne).toHaveBeenCalledWith(123);

        expect(llm.analyseScoutingReport).toHaveBeenCalledWith({
            playerId: 123,
            potential: 85,
            report: 'Strong technical ability',
        });
    });

    it('completes the queued report when LLM analysis succeeds', async () => {
        
        const message: ScoutingRequestMessage = {
            reportId: "f09389ec-018c-4835-996e-406fe671b45c",
            playerNo: 123,
            requestedAt: "2026-11-12T21:35:49.248Z",
        };

        const scoutingResult = {
            playerId: 123,
            potential: 85,
            report: 'Strong technical ability'
        }

        reports.findOneBy.mockResolvedValue({
            status: 'queued',
            reportId: "f09389ec-018c-4835-996e-406fe671b45c",
            playerNo: 123,
        });

        scouting.findOne.mockResolvedValue(scoutingResult);

        llm.analyseScoutingReport.mockResolvedValue(analysis);

        await service.process(message);
        expect(reports.save).toHaveBeenCalledTimes(1);
        expect(reports.save).toHaveBeenCalledWith(
        expect.objectContaining({
            reportId: message.reportId,
            playerNo: message.playerNo,
            status: 'completed',
            completedAt: expect.any(Date),
            requestedAt: expect.any(Date),
            result: {
                scouting: { ...scoutingResult },
                analysis: { ...analysis },
            },
        }),
        );
    });

    it('skips processing when the report is already completed', async () => {
        const message: ScoutingRequestMessage = {
            reportId: "f09389ec-018c-4835-996e-406fe671b45c",
            playerNo: 123,
            requestedAt: "2026-11-12T21:35:49.248Z",
        };

        reports.findOneBy.mockResolvedValue({
            status: 'completed',
            reportId: "f09389ec-018c-4835-996e-406fe671b45c",
            playerNo: 123,
        });

        await service.process(message);
        expect(scouting.findOne).not.toHaveBeenCalled();
        expect(llm.analyseScoutingReport).not.toHaveBeenCalled();
        expect(reports.save).not.toHaveBeenCalled();
    });

});