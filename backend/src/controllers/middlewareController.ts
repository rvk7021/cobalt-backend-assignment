import { Request, Response, NextFunction } from 'express';
import Workspace from '../models/Workspace';

export const validateTeamId = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { teamId } = req.params;
    if (!teamId) {
        res.status(400).json({ error: 'Team ID is required.' });
        return;
    }
    const workspace = await Workspace.findOne({ team_id: teamId });
    if (!workspace) {
        res.status(404).json({ error: 'Workspace not found.' });
        return;
    }
    (req as any).workspace = workspace;
    next();
};
