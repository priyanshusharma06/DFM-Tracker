import { DFMProject } from '../types/dfm';
import { SAMPLE_DRAWING_REV_A_SVG, SAMPLE_DRAWING_REV_B_SVG } from './sampleDrawings';

export const INITIAL_DFM_PROJECT: DFMProject = {
  id: 'proj-actuator-4820',
  partNumber: '4938-5-004 (4)',
  partName: 'Precision Housing Assembly',
  projectLead: 'Priyanshu Sharma (Advanced Operations)',
  department: 'Advanced Operations (AO) & New Product Introduction (NPI)',
  description: 'Continuous DFM tracking loops between R&D Design Engineering, AO Tooling/Manufacturing, Metrology Inspection, and Serial Machining Suppliers for early concept to production release.',
  createdAt: '2026-09-10T09:00:00.000Z',
  updatedAt: '2026-09-28T07:15:00.000Z',
  activeRevisionId: 'rev-02',
  currentFlow: 'WORKSPACE',
  revisions: [
    {
      id: 'rev-01',
      revCode: 'Rev 0.1',
      title: 'Concept Release (Initial AO & Supplier Review)',
      description: 'First engineering drawing drop from R&D CAD model. Initial DFM feedback captured on tooling feasibility, tight tolerances, and CMM accessibility.',
      date: '2026-09-12',
      author: 'Marcus Vance (R&D Lead)',
      drawingType: 'svg',
      drawingUrl: SAMPLE_DRAWING_REV_A_SVG,
      drawingFileName: 'AO-4820-D_Rev0.1_Concept.dwg',
      iteration: 1,
      balloons: [
        {
          id: 'b-01',
          balloonNumber: 1,
          customLabel: 'B-01',
          x: 27.5,
          y: 21.0,
          leaderTargetX: 23.0,
          leaderTargetY: 22.0,
          viewName: 'View 1: Front Elevation',
          featureName: 'Central Actuator Bore Diameter',
          dimensionType: 'DIAMETER',
          dimensionNature: 'STANDARD',
          nominalValue: '64.0',
          upperTol: '+0.016',
          lowerTol: '0',
          unit: 'mm',
          criticalCharacteristic: true,
          isRelevant: true,
          isVisible: true,
          status: 'ATTENTION',
          originRevisionId: 'rev-01',
          originRevisionName: 'Rev 0.1',
          feedbackList: [
            {
              id: 'fb-101',
              role: 'AO',
              authorName: 'AO Tooling Specialist',
              comment: 'Tolerance H6 (+0.016/-0 mm) at 160mm bore depth is too tight for our 4-axis horizontal CNC boring bars. It will cause high scrap and require an extra jig-grinding step. Can R&D relax this to H7 (+0.030/-0 mm)?',
              proposedChange: 'Relax bore from H6 to H7',
              suggestedTolerance: '+0.030 / 0',
              timestamp: '2026-09-13T10:15:00.000Z',
              revisionId: 'rev-01',
              statusUpdate: 'ATTENTION',
            },
            {
              id: 'fb-102',
              role: 'INSPECTION',
              authorName: 'Quality Metrology Lead',
              comment: 'H6 bore requires dedicated air-gauging ($8k tooling cost) or slow 3-point bore micrometer. Relaxing to H7 allows standard CMM scanning head verification with P95 capability.',
              timestamp: '2026-09-14T14:30:00.000Z',
              revisionId: 'rev-01',
              statusUpdate: 'ATTENTION',
            }
          ],
          revisionHistory: [
            {
              revisionId: 'rev-01',
              revisionName: 'Rev 0.1',
              date: '2026-09-12',
              nominalValue: '64.0',
              upperTol: '+0.016',
              lowerTol: '0',
              status: 'ATTENTION',
              summaryOfAction: 'AO and Inspection requested relaxation from H6 to H7 to avoid costly grinding.',
              verifiedInThisRev: false
            }
          ]
        },
        {
          id: 'b-02',
          balloonNumber: 2,
          customLabel: 'B-02',
          x: 54.5,
          y: 33.5,
          leaderTargetX: 53.0,
          leaderTargetY: 27.0,
          viewName: 'View 2: Section A-A',
          featureName: 'Internal Pocket Blind Corner Radius',
          dimensionType: 'RADIUS',
          dimensionNature: 'STANDARD',
          nominalValue: '0.50',
          upperTol: '+0.10',
          lowerTol: '0',
          unit: 'mm',
          criticalCharacteristic: false,
          isRelevant: true,
          isVisible: true,
          status: 'ATTENTION',
          originRevisionId: 'rev-01',
          originRevisionName: 'Rev 0.1',
          feedbackList: [
            {
              id: 'fb-201',
              role: 'AO',
              authorName: 'AO CNC Programmer',
              comment: 'R0.5 at 70mm pocket depth is physically impossible with standard carbide endmills (L/D ratio = 70:1). Tool will chatter and snap immediately. Request R2.5 or minimum R2.0.',
              proposedChange: 'Increase radius from R0.5 to R2.5',
              suggestedTolerance: 'R2.5 ± 0.25',
              timestamp: '2026-09-13T11:00:00.000Z',
              revisionId: 'rev-01',
              statusUpdate: 'ATTENTION',
            }
          ],
          revisionHistory: [
            {
              revisionId: 'rev-01',
              revisionName: 'Rev 0.1',
              date: '2026-09-12',
              nominalValue: '0.50',
              upperTol: '+0.10',
              lowerTol: '0',
              status: 'ATTENTION',
              summaryOfAction: 'Sharp internal corner identified. R&D agreed to bump to R2.5 in Rev 0.2.',
              verifiedInThisRev: false
            }
          ]
        },
        {
          id: 'b-03',
          balloonNumber: 3,
          customLabel: 'B-03',
          x: 40.5,
          y: 28.5,
          leaderTargetX: 47.5,
          leaderTargetY: 23.0,
          viewName: 'View 2: Section A-A',
          featureName: 'Cavity Web Wall Thickness',
          dimensionType: 'LINEAR',
          dimensionNature: 'STANDARD',
          nominalValue: '1.80',
          upperTol: '+0.08',
          lowerTol: '-0.08',
          unit: 'mm',
          criticalCharacteristic: true,
          isRelevant: true,
          isVisible: true,
          status: 'ATTENTION',
          originRevisionId: 'rev-01',
          originRevisionName: 'Rev 0.1',
          feedbackList: [
            {
              id: 'fb-301',
              role: 'AO',
              authorName: 'AO Manufacturing Engineer',
              comment: '1.8mm aluminum wall flexes under clamping pressure and cutting force during finish pass, leading to wall thickness variation and potential scrap. Recommend increasing to 2.4mm minimum.',
              proposedChange: 'Increase nominal wall thickness to 2.4mm',
              suggestedTolerance: '±0.15',
              timestamp: '2026-09-13T13:30:00.000Z',
              revisionId: 'rev-01',
              statusUpdate: 'ATTENTION',
            }
          ],
          revisionHistory: [
            {
              revisionId: 'rev-01',
              revisionName: 'Rev 0.1',
              date: '2026-09-12',
              nominalValue: '1.80',
              upperTol: '+0.08',
              lowerTol: '-0.08',
              status: 'ATTENTION',
              summaryOfAction: 'Wall thinness risk raised by AO.',
              verifiedInThisRev: false
            }
          ]
        },
        {
          id: 'b-04',
          balloonNumber: 4,
          customLabel: 'B-04',
          x: 10.5,
          y: 52.0,
          leaderTargetX: 14.5,
          leaderTargetY: 53.0,
          viewName: 'View 3: Actuator Mounting Pad',
          featureName: 'Actuator Flange Surface Finish',
          dimensionType: 'SURFACE_FINISH',
          dimensionNature: 'STANDARD',
          nominalValue: '0.40',
          upperTol: 'Ra max',
          lowerTol: '',
          unit: 'µm',
          criticalCharacteristic: false,
          isRelevant: true,
          isVisible: true,
          status: 'UNCHANGED',
          originRevisionId: 'rev-01',
          originRevisionName: 'Rev 0.1',
          feedbackList: [
            {
              id: 'fb-401',
              role: 'AO',
              authorName: 'AO Process Engineer',
              comment: 'Ra 0.4 requires surface grinding operation. Standard fly-cutting / face-milling on Makino horizontal CNC achieves Ra 0.8 consistently in single setup. Can Ra 0.8 be accepted?',
              proposedChange: 'Relax surface finish to Ra 0.8 µm',
              timestamp: '2026-09-14T09:40:00.000Z',
              revisionId: 'rev-01',
              statusUpdate: 'UNCHANGED',
            }
          ],
          revisionHistory: [
            {
              revisionId: 'rev-01',
              revisionName: 'Rev 0.1',
              date: '2026-09-12',
              nominalValue: '0.40',
              upperTol: 'Ra max',
              lowerTol: '',
              status: 'UNCHANGED',
              summaryOfAction: 'AO suggested relaxing from grinding Ra 0.4 to face-milling Ra 0.8.',
              verifiedInThisRev: false
            }
          ]
        },
        {
          id: 'b-05',
          balloonNumber: 5,
          customLabel: 'B-05',
          x: 23.0,
          y: 11.5,
          leaderTargetX: 23.0,
          leaderTargetY: 13.0,
          viewName: 'View 1: Front Elevation',
          featureName: 'Overall Housing Reference Width',
          dimensionType: 'LINEAR',
          dimensionNature: 'REFERENCE',
          nominalValue: '(220.0)',
          upperTol: 'REF',
          lowerTol: '',
          unit: 'mm',
          criticalCharacteristic: false,
          isRelevant: false, // Reference dimension, not relevant for DFM tolerance inspection!
          isVisible: false,
          status: 'UNCHANGED',
          originRevisionId: 'rev-01',
          originRevisionName: 'Rev 0.1',
          feedbackList: [],
          revisionHistory: []
        }
      ]
    },
    {
      id: 'rev-02',
      revCode: 'Rev 0.2',
      title: 'Tooling DFM Loop 2 (Implemented AO & Metrology Changes)',
      description: 'Second drawing release addressing Loop 1 DFM feedback: bore relaxed to H7, corner radius bumped to R2.5, wall thickened to 2.4mm.',
      date: '2026-09-24',
      author: 'Marcus Vance (R&D Lead)',
      drawingType: 'svg',
      drawingUrl: SAMPLE_DRAWING_REV_B_SVG,
      drawingFileName: 'AO-4820-D_Rev0.2_ToolingLoop.dwg',
      ecnNumber: 'ECN-2026-084',
      iteration: 2,
      sourceExcelName: 'DFM_Tracker_AO-4820-D_Rev0.1_Iter1.xlsx',
      balloons: [
        {
          id: 'b-01',
          balloonNumber: 1,
          customLabel: 'B-01',
          x: 27.5,
          y: 21.0,
          leaderTargetX: 23.0,
          leaderTargetY: 22.0,
          viewName: 'View 1: Front Elevation',
          featureName: 'Central Actuator Bore Diameter',
          dimensionType: 'DIAMETER',
          dimensionNature: 'STANDARD',
          nominalValue: '64.0',
          upperTol: '+0.030',
          lowerTol: '0',
          unit: 'mm',
          criticalCharacteristic: true,
          isRelevant: true,
          isVisible: true,
          status: 'ADDRESSED', // Turned green with checkmark!
          originRevisionId: 'rev-01',
          originRevisionName: 'Rev 0.1',
          feedbackList: [
            {
              id: 'fb-101',
              role: 'AO',
              authorName: 'AO Tooling Specialist',
              comment: 'Tolerance H6 (+0.016/-0 mm) at 160mm bore depth is too tight for our 4-axis horizontal CNC boring bars. It will cause high scrap and require an extra jig-grinding step. Can R&D relax this to H7 (+0.030/-0 mm)?',
              timestamp: '2026-09-13T10:15:00.000Z',
              revisionId: 'rev-01',
              isPreviousRevisionComment: true,
            },
            {
              id: 'fb-103',
              role: 'RD',
              authorName: 'Marcus Vance (R&D)',
              comment: 'Implemented in Rev 0.2: Bore updated to Ø64 H7 (+0.030 / 0). Dimension checked against O-ring gland backup ring specifications.',
              timestamp: '2026-09-24T10:00:00.000Z',
              revisionId: 'rev-02',
              statusUpdate: 'ADDRESSED',
            },
            {
              id: 'fb-104',
              role: 'AO',
              authorName: 'AO Tooling Specialist',
              comment: 'VERIFIED in Rev 0.2: H7 confirmed. We can now use standard Valenite twin-cutter finish boring heads without extra grinding!',
              timestamp: '2026-09-25T08:30:00.000Z',
              revisionId: 'rev-02',
              statusUpdate: 'ADDRESSED',
            }
          ],
          revisionHistory: [
            {
              revisionId: 'rev-01',
              revisionName: 'Rev 0.1',
              date: '2026-09-12',
              nominalValue: '64.0',
              upperTol: '+0.016',
              lowerTol: '0',
              status: 'ATTENTION',
              summaryOfAction: 'AO and Inspection requested relaxation from H6 to H7 to avoid costly grinding.',
              verifiedInThisRev: false
            },
            {
              revisionId: 'rev-02',
              revisionName: 'Rev 0.2',
              date: '2026-09-24',
              nominalValue: '64.0',
              upperTol: '+0.030',
              lowerTol: '0',
              status: 'ADDRESSED',
              summaryOfAction: 'R&D updated drawing to Ø64 H7 (+0.030 / 0). Verified and closed by AO.',
              verifiedInThisRev: true
            }
          ]
        },
        {
          id: 'b-02',
          balloonNumber: 2,
          customLabel: 'B-02',
          x: 54.5,
          y: 33.5,
          leaderTargetX: 53.0,
          leaderTargetY: 27.0,
          viewName: 'View 2: Section A-A',
          featureName: 'Internal Pocket Blind Corner Radius',
          dimensionType: 'RADIUS',
          dimensionNature: 'STANDARD',
          nominalValue: '2.50',
          upperTol: '+0.25',
          lowerTol: '0',
          unit: 'mm',
          criticalCharacteristic: false,
          isRelevant: true,
          isVisible: true,
          status: 'ADDRESSED', // Turned green with checkmark!
          originRevisionId: 'rev-01',
          originRevisionName: 'Rev 0.1',
          feedbackList: [
            {
              id: 'fb-201',
              role: 'AO',
              authorName: 'AO CNC Programmer',
              comment: 'R0.5 at 70mm pocket depth is physically impossible with standard carbide endmills (L/D ratio = 70:1). Request R2.5.',
              timestamp: '2026-09-13T11:00:00.000Z',
              revisionId: 'rev-01',
              isPreviousRevisionComment: true,
            },
            {
              id: 'fb-203',
              role: 'RD',
              authorName: 'Marcus Vance (R&D)',
              comment: 'Implemented in Rev 0.2: Corner radius increased to R2.50 (+0.25/0). Solid model updated.',
              timestamp: '2026-09-24T10:05:00.000Z',
              revisionId: 'rev-02',
              statusUpdate: 'ADDRESSED',
            }
          ],
          revisionHistory: [
            {
              revisionId: 'rev-01',
              revisionName: 'Rev 0.1',
              date: '2026-09-12',
              nominalValue: '0.50',
              upperTol: '+0.10',
              lowerTol: '0',
              status: 'ATTENTION',
              summaryOfAction: 'Sharp internal corner identified.',
              verifiedInThisRev: false
            },
            {
              revisionId: 'rev-02',
              revisionName: 'Rev 0.2',
              date: '2026-09-24',
              nominalValue: '2.50',
              upperTol: '+0.25',
              lowerTol: '0',
              status: 'ADDRESSED',
              summaryOfAction: 'Corner radius increased from R0.5 to R2.5.',
              verifiedInThisRev: true
            }
          ]
        },
        {
          id: 'b-03',
          balloonNumber: 3,
          customLabel: 'B-03',
          x: 40.5,
          y: 28.5,
          leaderTargetX: 47.5,
          leaderTargetY: 23.0,
          viewName: 'View 2: Section A-A',
          featureName: 'Cavity Web Wall Thickness',
          dimensionType: 'LINEAR',
          dimensionNature: 'STANDARD',
          nominalValue: '2.40',
          upperTol: '+0.15',
          lowerTol: '-0.15',
          unit: 'mm',
          criticalCharacteristic: true,
          isRelevant: true,
          isVisible: true,
          status: 'ADDRESSED', // Turned green with checkmark!
          originRevisionId: 'rev-01',
          originRevisionName: 'Rev 0.1',
          feedbackList: [
            {
              id: 'fb-301',
              role: 'AO',
              authorName: 'AO Manufacturing Engineer',
              comment: '1.8mm aluminum wall flexes under clamping pressure and cutting force during finish pass, leading to wall thickness variation. Recommend 2.4mm.',
              timestamp: '2026-09-13T13:30:00.000Z',
              revisionId: 'rev-01',
              isPreviousRevisionComment: true,
            },
            {
              id: 'fb-302',
              role: 'RD',
              authorName: 'Marcus Vance (R&D)',
              comment: 'Implemented in Rev 0.2: Wall thickness increased to 2.40 ± 0.15mm.',
              timestamp: '2026-09-24T10:10:00.000Z',
              revisionId: 'rev-02',
              statusUpdate: 'ADDRESSED',
            }
          ],
          revisionHistory: [
            {
              revisionId: 'rev-01',
              revisionName: 'Rev 0.1',
              date: '2026-09-12',
              nominalValue: '1.80',
              upperTol: '+0.08',
              lowerTol: '-0.08',
              status: 'ATTENTION',
              summaryOfAction: 'Wall thinness risk raised by AO.',
              verifiedInThisRev: false
            },
            {
              revisionId: 'rev-02',
              revisionName: 'Rev 0.2',
              date: '2026-09-24',
              nominalValue: '2.40',
              upperTol: '+0.15',
              lowerTol: '-0.15',
              status: 'ADDRESSED',
              summaryOfAction: 'Wall thickness bumped from 1.8mm to 2.4mm.',
              verifiedInThisRev: true
            }
          ]
        },
        {
          id: 'b-04',
          balloonNumber: 4,
          customLabel: 'B-04',
          x: 10.5,
          y: 52.0,
          leaderTargetX: 14.5,
          leaderTargetY: 53.0,
          viewName: 'View 3: Actuator Mounting Pad',
          featureName: 'Actuator Flange Surface Finish',
          dimensionType: 'SURFACE_FINISH',
          dimensionNature: 'STANDARD',
          nominalValue: '0.80',
          upperTol: 'Ra max',
          lowerTol: '',
          unit: 'µm',
          criticalCharacteristic: false,
          isRelevant: true,
          isVisible: true,
          status: 'UNCHANGED', // Yellow with NO symbol
          originRevisionId: 'rev-01',
          originRevisionName: 'Rev 0.1',
          feedbackList: [
            {
              id: 'fb-401',
              role: 'AO',
              authorName: 'AO Process Engineer',
              comment: 'Ra 0.4 requires surface grinding operation. Standard face-milling achieves Ra 0.8 consistently in single setup.',
              timestamp: '2026-09-14T09:40:00.000Z',
              revisionId: 'rev-01',
              isPreviousRevisionComment: true,
            },
            {
              id: 'fb-402',
              role: 'RD',
              authorName: 'Marcus Vance (R&D)',
              comment: 'Implemented in Rev 0.2: Changed from Ra 0.4 to Ra 0.8 max. Awaiting AO trial verification.',
              timestamp: '2026-09-24T10:15:00.000Z',
              revisionId: 'rev-02',
              statusUpdate: 'UNCHANGED',
            }
          ],
          revisionHistory: [
            {
              revisionId: 'rev-01',
              revisionName: 'Rev 0.1',
              date: '2026-09-12',
              nominalValue: '0.40',
              upperTol: 'Ra max',
              lowerTol: '',
              status: 'UNCHANGED',
              summaryOfAction: 'AO suggested relaxing from grinding Ra 0.4 to face-milling Ra 0.8.',
              verifiedInThisRev: false
            }
          ]
        },
        {
          id: 'b-05',
          balloonNumber: 5,
          customLabel: 'B-05',
          x: 23.0,
          y: 11.5,
          leaderTargetX: 23.0,
          leaderTargetY: 13.0,
          viewName: 'View 1: Front Elevation',
          featureName: 'Overall Housing Reference Width',
          dimensionType: 'LINEAR',
          dimensionNature: 'REFERENCE',
          nominalValue: '(220.0)',
          upperTol: 'REF',
          lowerTol: '',
          unit: 'mm',
          criticalCharacteristic: false,
          isRelevant: false, // Filtered out Reference dimension!
          isVisible: false,
          status: 'UNCHANGED',
          originRevisionId: 'rev-01',
          originRevisionName: 'Rev 0.1',
          feedbackList: [],
          revisionHistory: []
        }
      ]
    }
  ]
};

INITIAL_DFM_PROJECT.revisions.forEach((rev) => {
  rev.totalSheets = rev.totalSheets || 1;
  rev.balloons.forEach((b) => {
    if (!b.sheetNumber) b.sheetNumber = 1;
  });
});
