import { lazy, Suspense } from 'react';
import { getSaveSlotMeta,loadGameFromStorage,SaveSlotId } from './utils/storage';

import { Header } from './components/Header';
import { HomeScreen } from './components/HomeScreen';

const AgeDeclineModal = lazy(() => import('./components/AgeDeclineModal').then((module) => ({ default: module.AgeDeclineModal })));
const AttributesPanel = lazy(() => import('./components/AttributesPanel').then((module) => ({ default: module.AttributesPanel })));
const ContractSigningModal = lazy(() => import('./components/ContractSigningModal').then((module) => ({ default: module.ContractSigningModal })));
const CreationModal = lazy(() => import('./components/CreationModal').then((module) => ({ default: module.CreationModal })));
const DraftNightModal = lazy(() => import('./components/DraftNightModal').then((module) => ({ default: module.DraftNightModal })));
const DraftWaitingAnimationModal = lazy(() => import('./components/DraftWaitingAnimationModal').then((module) => ({ default: module.DraftWaitingAnimationModal })));
const HallOfFame = lazy(() => import('./components/HallOfFame').then((module) => ({ default: module.HallOfFame })));
const LeagueStandings = lazy(() => import('./components/LeagueStandings').then((module) => ({ default: module.LeagueStandings })));
const LegendaryHallOfFameModal = lazy(() => import('./components/LegendaryHallOfFameModal').then((module) => ({ default: module.LegendaryHallOfFameModal })));
const MatchSimulator = lazy(() => import('./components/MatchSimulator').then((module) => ({ default: module.MatchSimulator })));
const MilestoneModal = lazy(() => import('./components/MilestoneModal').then((module) => ({ default: module.MilestoneModal })));
const MilestonesView = lazy(() => import('./components/MilestonesView').then((module) => ({ default: module.MilestonesView })));
const PostMatchModal = lazy(() => import('./components/PostMatchModal').then((module) => ({ default: module.PostMatchModal })));
const RealTradesModal = lazy(() => import('./components/RealTradesModal').then((module) => ({ default: module.RealTradesModal })));
const RetirementFlowModal = lazy(() => import('./components/RetirementFlowModal').then((module) => ({ default: module.RetirementFlowModal })));
const RookieDraftAndScoutModal = lazy(() => import('./components/RookieDraftAndScoutModal').then((module) => ({ default: module.RookieDraftAndScoutModal })));
const RosterAndTransfers = lazy(() => import('./components/RosterAndTransfers').then((module) => ({ default: module.RosterAndTransfers })));
const SaveSlotsModal = lazy(() => import('./components/SaveSlotsModal').then((module) => ({ default: module.SaveSlotsModal })));
const SeasonDashboard = lazy(() => import('./components/SeasonDashboard').then((module) => ({ default: module.SeasonDashboard })));
const SettingsModal = lazy(() => import('./components/SettingsModal').then((module) => ({ default: module.SettingsModal })));
const SocialAndLife = lazy(() => import('./components/SocialAndLife').then((module) => ({ default: module.SocialAndLife })));
const TimelinePage = lazy(() => import('./components/TimelinePage').then((module) => ({ default: module.TimelinePage })));

import { useCareerGame } from './hooks/useCareerGame';

export default function App() {
  const {
    handleOpenSaveSlots,
    phase,
    setPhase,
    prevPhase,
    setPrevPhase,
    currentSaveSlot,
    isSaveSlotsOpen,
    setIsSaveSlotsOpen,
    toastMsg,
    currentYear,
    currentSeasonWeek,
    setCurrentSeasonWeek,
    isPlayoffs,
    setIsPlayoffs,
    activeTab,
    setActiveTab,
    lastSavedAt,
    storageReady,
    showSettingsModal,
    setShowSettingsModal,
    isLegendaryHofOpen,
    setIsLegendaryHofOpen,
    legendaryHofInitialMode,
    setLegendaryHofInitialMode,
    showAgeDeclineModal,
    showToast,
    teams,
    setTeams,
    player,
    setPlayer,
    isInteractiveMatch,
    lastMatchResult,
    schedule,
    tweets,
    careerHistory,
    leagueHistory,
    usedOffseasonEventIds,
    offseasonMonth,
    setOffseasonMonth,
    offseasonCompletedPlans,
    setOffseasonCompletedPlans,
    offseasonEventMonths,
    showDraftWaitingAnimation,
    setShowDraftWaitingAnimation,
    offseasonPhase,
    setOffseasonPhase,
    isDraftCompleted,
    setIsDraftCompleted,
    isContractCompleted,
    setIsContractCompleted,
    contractStep,
    setContractStep,
    renewalOffer,
    setRenewalOffer,
    freeAgencyOffers,
    setFreeAgencyOffers,
    tradeModalData,
    setTradeModalData,
    activeInSeasonTradeOffers,
    setActiveInSeasonTradeOffers,
    activeMilestoneModal,
    setActiveMilestoneModal,
    handleAddUsedEventId,
    handleEnterOffseason,
    handleSignNewContract,
    handleAgeDeclineRetire,
    handleAgeDeclineContinue,
    getCurrentSavedData,
    handleQuickSave,
    handleLoadSaveData,
    handleManualSave,
    handleResetGame,
    handleCurrentSlotDeleted,
    handlePlayerCreated,
    handleCompleteDraft,
    handleSignContract,
    handleStartMatch,
    handleFinishMatch,
    handlePostMatchContinue,
    handleAdvanceInjury,
    handleUpgradeAttribute,
    handleAddSkillPoints,
    handleWatchAttributeAd,
    handleAllInAttribute,
    handleResetAttribute,
    handleWorkout,
    handleRest,
    handleUnlockEndorsement,
    handleCreateSignatureShoe,
    handleBuyLuxuryItem,
    handleRequestTrade,
    handleNextSeason,
    handleViewSeasonTrades,
    currentTeam,
    oppTeam,
  } = useCareerGame();


  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* Draft Waiting Animation Modal */}
      <Suspense fallback={null}>
        {showDraftWaitingAnimation && (
          <DraftWaitingAnimationModal
            currentYear={currentYear + 1}
            onComplete={() => setShowDraftWaitingAnimation(false)}
          />
        )}
      </Suspense>

      {/* Floating Toast Notification */}
      {toastMsg && (
        <div className="safe-area-top-toast fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-black font-black text-xs sm:text-sm shadow-2xl border border-amber-300 animate-bounce flex items-center gap-2 pointer-events-none">
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Title / Home Screen Phase */}
      {phase === 'home' && (() => {
        const slots: SaveSlotId[] = ['slot_1', 'slot_2', 'slot_3', 'slot_4'];
        const activeMetas = slots.map((s) => getSaveSlotMeta(s)).filter((m) => !m.isEmpty);
        const hasSave = !!player || (storageReady && activeMetas.length > 0);
        const latestMeta = activeMetas.sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime())[0] || getSaveSlotMeta('slot_1');

        return (
          <HomeScreen
            hasActiveSave={hasSave}
            latestSaveMeta={latestMeta}
            onContinueGame={() => {
              const latestSlot = activeMetas[0]?.slotId || 'slot_1';
              const saved = loadGameFromStorage(latestSlot) || loadGameFromStorage('slot_1');
              if (saved && saved.player) {
                handleLoadSaveData(saved);
              } else if (player) {
                setPhase('regular_season');
              } else {
                setPhase('creation');
              }
            }}
            onStartNewCareer={() => {
              setPhase('creation');
            }}
            onOpenSaveManager={handleOpenSaveSlots}
            onOpenSettings={() => setShowSettingsModal(true)}
            onOpenHallOfFame={() => {
              setLegendaryHofInitialMode('local');
              setPrevPhase(phase);
              setPhase('legendary_hof');
            }}
            onOpenGlobalHallOfFame={() => {
              setLegendaryHofInitialMode('global');
              setPrevPhase(phase);
              setPhase('legendary_hof');
            }}
          />
        );
      })()}

      {/* Creation Phase */}
      <Suspense fallback={(
        <div className="min-h-screen bg-[#0a0d14] text-amber-300 flex items-center justify-center font-black tracking-widest">
          正在加载生涯数据…
        </div>
      )}>
        {phase === 'creation' && (
          <CreationModal
            onComplete={handlePlayerCreated}
            onBackToHome={() => setPhase('home')}
          />
        )}

        {/* Scout Report & Spotlight Draft Selection Phase */}
        {phase === 'scout_draft' && player && (
          <RookieDraftAndScoutModal
            player={player}
            teams={teams}
            onProceedToContract={() => setPhase('contract_signing')}
          />
        )}

        {/* 2008 Draft Night Phase */}
        {phase === 'draft' && player && (
          <DraftNightModal player={player} teams={teams} onComplete={handleCompleteDraft} />
        )}

        {/* Contract Signing Phase */}
        {phase === 'contract_signing' && player && (
          <ContractSigningModal
            player={player}
            team={currentTeam}
            pick={player.draftPick || 1}
            onSignContract={handleSignContract}
          />
        )}
      </Suspense>

      {/* Main Game Interface (Header & Tabs) */}
      {player && phase !== 'home' && phase !== 'creation' && phase !== 'scout_draft' && phase !== 'draft' && phase !== 'contract_signing' && phase !== 'legendary_hof' && (
        <>
          <Header
            player={player}
            currentTeam={currentTeam}
            currentYear={currentYear}
            careerSeasons={careerHistory.length}
            seasonWeek={currentSeasonWeek}
            isPlayoffs={isPlayoffs}
            onOpenAttributes={() => setActiveTab('attributes')}
            onOpenSettings={() => setShowSettingsModal(true)}
            onOpenSaveManager={handleOpenSaveSlots}
            onGoHome={() => setPhase('home')}
            onQuickSave={handleQuickSave}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />

          <Suspense fallback={(
            <main className="max-w-7xl mx-auto px-2 sm:px-4 py-8 pb-24 md:pb-6 text-center text-sm font-bold text-slate-400">
              正在加载页面…
            </main>
          )}>
          <main className="max-w-7xl mx-auto px-2 sm:px-4 py-3 sm:py-6 pb-24 md:pb-6">
            {activeTab === 'season' && (
              <SeasonDashboard
                gameState={{
                  currentYear,
                  currentGame: currentSeasonWeek,
                  currentSeasonWeek,
                  isPlayoffs,
                  playoffRound: 1,
                  playoffSeriesWins: 0,
                  playoffSeriesLosses: 0,
                  playoffOpponentId: null,
                  phase,
                  player,
                  teams,
                  schedule,
                  tweets,
                  lastMatchResult,
                  careerHistory,
                }}
                currentTeam={currentTeam}
                oppTeam={oppTeam}
                usedEventIds={usedOffseasonEventIds}
                offseasonMonth={offseasonMonth}
                offseasonCompletedPlans={offseasonCompletedPlans}
                offseasonEventMonths={offseasonEventMonths}
                offseasonPhase={offseasonPhase}
                isDraftCompleted={isDraftCompleted}
                isContractCompleted={isContractCompleted}
                contractStep={contractStep}
                renewalOffer={renewalOffer}
                freeAgencyOffers={freeAgencyOffers}
                onSetOffseasonPhase={setOffseasonPhase}
                onSetIsDraftCompleted={setIsDraftCompleted}
                onSetIsContractCompleted={setIsContractCompleted}
                onSetContractStep={setContractStep}
                onSetRenewalOffer={setRenewalOffer}
                onSetFreeAgencyOffers={setFreeAgencyOffers}
                onStartMatch={handleStartMatch}
                onAdvanceInjury={handleAdvanceInjury}
                onWorkout={handleWorkout}
                onRest={handleRest}
                onAdvanceWeek={() => setCurrentSeasonWeek((prev) => Math.min(83, prev + 1))}
                onEnterPlayoffs={() => setIsPlayoffs(true)}
                onEnterOffseason={handleEnterOffseason}
                onNextSeason={handleNextSeason}
                onUpdatePlayer={(p) => setPlayer(p)}
                onUpdateTeams={(updatedTeams) => setTeams(updatedTeams)}
                onSetOffseasonMonth={setOffseasonMonth}
                onSetOffseasonCompletedPlans={setOffseasonCompletedPlans}
                onAddUsedEventId={handleAddUsedEventId}
                onSignContract={handleSignNewContract}
                onViewSeasonTrades={handleViewSeasonTrades}
                hasActiveMilestoneModal={!!activeMilestoneModal || showAgeDeclineModal}
                isSettingsOpen={showSettingsModal}
              />
            )}

            {activeTab === 'standings' && (
              <LeagueStandings
                teams={teams}
                userTeamId={player.currentTeamId}
                player={player}
                currentYear={currentYear}
                careerHistory={careerHistory}
                schedule={schedule}
              />
            )}

            {activeTab === 'attributes' && (
              <AttributesPanel
                player={player}
                onUpgradeAttribute={handleUpgradeAttribute}
                onWatchAd={handleWatchAttributeAd}
                onAllInAttribute={handleAllInAttribute}
                onResetAttribute={handleResetAttribute}
              />
            )}

            {activeTab === 'social' && (
              <SocialAndLife
                player={player}
                tweets={tweets}
                onUnlockEndorsement={handleUnlockEndorsement}
                onCreateSignatureShoe={handleCreateSignatureShoe}
                onBuyLuxuryItem={handleBuyLuxuryItem}
                careerSeasons={careerHistory.length}
                currentYear={currentYear}
              />
            )}

            {activeTab === 'roster' && (
              <RosterAndTransfers
                player={player}
                currentTeam={currentTeam}
                allTeams={teams}
                onRequestTrade={handleRequestTrade}
                onSignContract={handleSignNewContract}
                onUpdatePlayer={setPlayer}
                currentYear={currentYear}
                activeInSeasonTradeOffers={activeInSeasonTradeOffers}
                onSetActiveInSeasonTradeOffers={setActiveInSeasonTradeOffers}
                currentGame={currentSeasonWeek}
                isPlayoffs={isPlayoffs}
              />
            )}

            {activeTab === 'timeline' && (
              <TimelinePage
                player={player}
                careerHistory={careerHistory}
                leagueHistory={leagueHistory}
                currentYear={currentYear}
              />
            )}

            {activeTab === 'milestones' && (
              <MilestonesView player={player} />
            )}

            {activeTab === 'hof' && (
              <HallOfFame
                player={player}
                careerHistory={careerHistory}
                leagueHistory={leagueHistory}
                currentYear={currentYear}
                onRetireCareer={() => {
                  setPrevPhase(phase);
                  setPhase('hall_of_fame');
                }}
                onOpenLegendaryHof={() => {
                  setPrevPhase(phase);
                  setPhase('legendary_hof');
                }}
              />
            )}
          </main>
          </Suspense>
        </>
      )}

      <Suspense fallback={null}>
        {/* Match Simulator Modal */}
        {phase === 'match_sim' && player && (
          <MatchSimulator
            player={player}
            userTeam={currentTeam}
            oppTeam={oppTeam}
            isInteractive={isInteractiveMatch}
            isPlayoffs={isPlayoffs}
            currentYear={currentYear}
            onFinishMatch={handleFinishMatch}
          />
        )}

      {/* Post Match Modal */}
      {phase === 'post_match' && player && lastMatchResult && (
        <PostMatchModal
          player={player}
          userTeam={currentTeam}
          oppTeam={oppTeam}
          boxScore={lastMatchResult}
          currentYear={currentYear}
          careerHistory={careerHistory}
          onContinue={handlePostMatchContinue}
        />
      )}

      {/* Retirement Flow Modal */}
      {phase === 'hall_of_fame' && player && (
        <RetirementFlowModal
          player={player}
          careerHistory={careerHistory}
          leagueHistory={leagueHistory}
          currentYear={currentYear}
          initialStep={(player.age || 19) >= 43 ? 'timeline' : 'confirm'}
          onClose={() => setPhase(prevPhase && prevPhase !== 'hall_of_fame' ? prevPhase : 'regular_season')}
          onResetGame={handleResetGame}
        />
      )}

      {/* Age 38+ Physical Decline Choice Modal */}
      {showAgeDeclineModal && player && (
        <AgeDeclineModal
          player={player}
          userTeamName={currentTeam?.name || '球队'}
          seasonsPlayed={(careerHistory?.length || 0) + 1}
          currentYear={currentYear}
          onRetire={handleAgeDeclineRetire}
          onContinue={handleAgeDeclineContinue}
        />
      )}

      {/* Real Trades Popup Modal */}
      {tradeModalData && (
        <RealTradesModal
          modalData={tradeModalData}
          teams={teams}
          onConfirm={() => setTradeModalData(null)}
        />
      )}

      {/* System Settings & Auto-Save Modal */}
      {showSettingsModal && (
        <SettingsModal
          player={player}
          currentTeam={currentTeam}
          currentYear={currentYear}
          seasonWeek={currentSeasonWeek}
          lastSavedAt={lastSavedAt}
          currentSlotId={currentSaveSlot}
          onManualSave={handleManualSave}
          onOpenSaveManager={() => {
            setShowSettingsModal(false);
            handleOpenSaveSlots();
          }}
          onGoHome={() => {
            setShowSettingsModal(false);
            setPhase('home');
          }}
          onClose={() => setShowSettingsModal(false)}
        />
      )}

        {/* Save Slots & File Manager Modal */}
        {isSaveSlotsOpen && (
          <SaveSlotsModal
            isOpen={true}
            onClose={() => setIsSaveSlotsOpen(false)}
            currentSaveData={getCurrentSavedData()}
            currentSlotId={currentSaveSlot}
            onLoadSaveData={handleLoadSaveData}
            onCurrentSlotDeleted={handleCurrentSlotDeleted}
            onShowToast={showToast}
          />
        )}
      </Suspense>

      {/* Legendary Hall of Fame Page */}
      <Suspense fallback={(
        phase === 'legendary_hof'
          ? <div className="min-h-screen bg-[#0a0d14] text-amber-300 flex items-center justify-center font-black tracking-widest">正在加载传奇榜…</div>
          : null
      )}>
        {(phase === 'legendary_hof' || isLegendaryHofOpen) && (
          <LegendaryHallOfFameModal
            isOpen={true}
            initialMode={legendaryHofInitialMode}
            onClose={() => {
              setIsLegendaryHofOpen(false);
              if (phase === 'legendary_hof') setPhase(prevPhase || 'home');
            }}
            onGoHome={() => {
              setIsLegendaryHofOpen(false);
              setPhase('home');
            }}
          />
        )}
      </Suspense>

      {/* Milestone Modal */}
      <Suspense fallback={null}>
        {activeMilestoneModal && (
          <MilestoneModal
            milestone={activeMilestoneModal}
            playerName={player?.name || '球星'}
            onClose={() => setActiveMilestoneModal(null)}
            onViewMilestones={() => {
              setActiveMilestoneModal(null);
              if (phase === 'home' || phase === 'creation' || phase === 'scout_draft' || phase === 'draft' || phase === 'contract_signing') {
                setPhase('career');
              }
              setActiveTab('milestones');
            }}
          />
        )}
      </Suspense>
    </div>
  );
}
