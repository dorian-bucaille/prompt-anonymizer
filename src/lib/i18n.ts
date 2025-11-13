import i18n, { type Resource } from "i18next";
import { initReactI18next } from "react-i18next";

const STORAGE_KEY = "equilibre-couple:lang";
const fallbackLng = "fr" as const;

const getInitialLanguage = () => {
  if (typeof window === "undefined") {
    return fallbackLng;
  }
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored) {
    return stored;
  }
  const navigatorLang = window.navigator.language?.split("-")[0];
  if (navigatorLang === "fr" || navigatorLang === "en") {
    return navigatorLang;
  }
  return fallbackLng;
};

const resources: Resource = {
  fr: {
    translation: {
      languages: {
        fr: "Français",
        en: "English",
      },
      header: {
        title: "💞 Équilibre couple — calculateur",
        description:
          "Ajustez vos contributions communes en quelques secondes et visualisez un partage équilibré, clair et apaisant.",
        github: "GitHub",
      },
      actions: {
        copyLink: "Copier le lien",
        copyLinkSuccess: "Lien copié dans le presse-papiers.",
        print: "Imprimer / PDF",
        reset: "Réinitialiser",
        confirmLoad: "Charger cet enregistrement va remplacer les valeurs actuelles. Continuer ?",
        confirmClearFirst: "Supprimer tout l'historique local ?",
        confirmClearSecond: "Cette action est définitive. Confirmer la suppression ?",
      },
      accessibility: {
        modeProportional: "Mode proportionnel activé",
        modeEqualLeftover: "Mode reste à vivre égal activé",
        historyCleared: "Historique effacé",
        historyLoaded: "Enregistrement du {{date}} chargé",
        toggleDarkMode: "Basculer mode sombre",
        info: "Informations complémentaires",
        languageSwitcher: "Changer de langue",
      },
      parameters: {
        title: "Paramètres",
        description:
          "Personnalisez les revenus, les tickets restaurant et le budget commun pour obtenir une proposition sur-mesure.",
        partnerNameLabel: "Nom partenaire {{label}}",
        partnerPlaceholder: "Partenaire {{label}}",
        partnerTooltip:
          "Personnalise le nom utilisé pour le partenaire {{label}} dans les calculs et graphiques",
        modeLabel: "Mode de répartition",
        modeTooltip:
          "Proportionnel : chacun contribue selon ses moyens. Reste à vivre égal : chacun garde le même reste cash après contribution.",
        modes: {
          proportional: {
            title: "Proportionnel",
            description: "Chacun contribue selon ses moyens, tickets resto inclus.",
            announcement: "Mode proportionnel",
          },
          equal_leftover: {
            title: "Reste à vivre égal",
            description: "Alignement du cash restant après contribution pour chaque partenaire.",
            announcement: "Mode reste à vivre égal",
          },
        },
        salaryLabel: "Salaire {{name}}",
        ticketsLabel: "Tickets resto {{name}}",
        sharedBudgetLabel: "Budget commun hors TR",
        trPctLabel: "% TR effectivement dépensés",
        eligibleLabel: "Dépenses éligibles TR (E)",
        codeSuffix: " ({{code}})",
        trPctTooltip: "Pourcentage des TR réellement consommés",
        eligibleTooltip:
          "Montant mensuel des dépenses éligibles (courses/resto) qui peuvent être payées en TR",
        sharedBudgetTooltip: "Part du budget commun non éligible TR (cash)",
        salaryTooltip: "Salaire net mensuel de {{name}}",
        ticketsTooltip: "Montant mensuel brut de tickets restaurant crédités pour {{name}}",
        advancedToggle: {
          title: "Mode avancé",
          description: "Ajouter les dépenses éligibles et ajuster finement la contribution.",
          helper: "Permet de saisir E = dépenses éligibles TR (au‑delà des TR)",
        },
        bias: {
          label: "Ajustement du prorata (favoriser {{partnerA}} ou {{partnerB}})",
          summaryNeutral: "Neutre",
          summaryFavor: "Favorise {{name}} ({{points}} pts)",
          summaryDetail: "{{points}} points pour {{name}}",
          helper: "Valeur positive: favorise {{partnerB}} ({{partnerA}} paie davantage). Valeur négative: favorise {{partnerA}} ({{partnerA}} paie moins).",
          sliderLabel: "Ajustement du prorata ({{partnerA}} ↔ {{partnerB}})",
          favorA: "Favoriser {{name}}",
          favorB: "Favoriser {{name}}",
          neutral: "Neutre",
          disabled: "Biais non applicable en mode “Reste à vivre égal”.",
        },
        suffix: {
          euroMonth: "€ / mois",
          percent: "%",
        },
      },
      summary: {
        title: "Résumé",
        description:
          "Aperçu instantané de la répartition et du niveau de contribution de chaque partenaire.",
        labels: {
          share: "Part {{name}}",
          deposit: "Dépôt {{name}}",
          leftover: "Reste {{name}}",
          totalCash: "Cash total à déposer",
          usedTr: "TR utilisés (V)",
          totalPot: "Pot total (M)",
          warnings: "Avertissements",
        },
        chart: {
          title: "Répartition des contributions",
          centerPercent: "Total (%)",
          centerAmount: "Total (€)",
          deposit: "Dépôt {{name}}",
          tr: "TR {{name}}",
        },
        saveBlock: {
          title: "Sauvegarder cette configuration",
          description: "Les enregistrements sont stockés localement sur cet appareil.",
          addNote: "Ajouter une note",
          save: "Enregistrer dans l'historique",
        },
      },
      calculationInfo: {
        aria: "Comprendre les modèles de calcul",
        toggle: "Comprendre le calcul",
        sectionTitle: "Comprendre les deux modèles",
        objectiveTitle: "🎯 Objectif",
        objectiveText:
          "Répartir les dépenses communes en respectant les moyens de chacun pour que l’effort ressenti reste comparable, sans viser un partage strictement 50/50.",
        modelsTitle: "⚖️ Deux modèles",
        proportionalTitle: "⚖️ Modèle 1 — Proportionnel aux revenus (avec TR)",
        proportionalList: [
          "Calcule les moyens réels : salaires + tickets resto consommés.",
          "Attribue à chacun une part au prorata de ces moyens.",
          "Déduit les TR déjà utilisés avant de demander du cash.",
          "Ajuste le budget commun en incluant la part éligible TR.",
        ],
        equalTitle: "⚖️ Modèle 2 — Reste à vivre égal",
        equalList: [
          "Fixe un objectif : même reste cash pour A et B après contribution.",
          "Répartit le dépôt nécessaire pour aligner ces restes.",
          "Intègre les TR déjà utilisés pour réduire l’effort demandé.",
          "Compense si l’un devrait contribuer négativement (borne à 0).",
        ],
        trTitle: "🍽️ Tickets resto",
        trText:
          "Les TR sont comptés comme contribution en nature sur les dépenses éligibles. Seule la part réellement consommée est prise en compte.",
        biasTitle: "🎚️ Biais",
        biasText:
          "L’ajustement du prorata permet de déplacer légèrement la part de A ou B pour répondre à un inconfort ponctuel ou équilibrer des charges personnelles.",
        limitsTitle: "🧩 Limites",
        limitsList: [
          "Adapter le % de TR si tous ne sont pas dépensés pour les dépenses communes.",
          "Surveiller la part du budget non éligible TR pour évaluer l’effort ressenti.",
          "Prendre en compte les charges personnelles marquées si elles diffèrent beaucoup.",
        ],
        detailsLink: "Voir les formules détaillées",
      },
      details: {
        title: "Détails du calcul",
        show: "Afficher les détails",
        hide: "Masquer les détails",
        warnings: "Avertissements",
        note: "Note: les tickets resto sont comptés comme une <strong>contribution en nature</strong>.",
      },
      glossary: {
        aria: "Glossaire contextuel",
        title: "Glossaire",
        terms: [
          {
            term: "m",
            description: "Budget commun à alimenter en cash (dépenses non éligibles aux tickets resto).",
          },
          {
            term: "E",
            description: "Montant mensuel des dépenses éligibles aux tickets resto qui dépassent les TR disponibles.",
          },
          {
            term: "V",
            description: "Total des tickets restaurant réellement utilisés dans le calcul (après application du % TR effectifs).",
          },
          {
            term: "TR effectifs",
            description:
              "Montant de tickets resto pris en compte après avoir appliqué le pourcentage de TR effectivement dépensés.",
          },
          {
            term: "Pot total (M)",
            description:
              "Budget mutualisé utilisé pour répartir les dépenses: cash m + dépenses éligibles (E) ou tickets utilisés (V).",
          },
          {
            term: "Biais",
            description:
              "Ajustement manuel du prorata: valeur positive favorise B (A paie plus), valeur négative favorise A (A paie moins).",
          },
        ],
      },
      history: {
        title: "Historique",
        description: "Jusqu'à 60 enregistrements sont conservés sur cet appareil.",
        clear: "Tout effacer",
        noteLabel: "Note",
        notePlaceholder: "Oct. 2025 – nouveau loyer",
        searchLabel: "Recherche",
        searchPlaceholder: "Filtrer par note ou mois",
        periodLabel: "Période",
        periodOptions: {
          all: "Tout",
          three: "3 derniers mois",
          six: "6 derniers mois",
          twelve: "12 derniers mois",
        },
        save: "Enregistrer dans l'historique",
        maxWarning:
          "Capacité maximale atteinte. Le prochain enregistrement remplacera le plus ancien.",
        empty: "Aucun enregistrement ne correspond à votre recherche.",
        listLabel: "Historique des calculs enregistrés",
        listActions: "Actions pour l'enregistrement du {{label}}",
        load: "Charger",
        details: "Détails",
        delete: "Supprimer",
        loadAria: "Charger l'enregistrement du {{label}}",
        detailsAria: "Afficher les détails de l'enregistrement du {{label}}",
        deleteAria: "Supprimer l'enregistrement du {{label}}",
        boolYes: "Oui",
        boolNo: "Non",
        defaultValue: "(par défaut)",
        noNote: "(sans note)",
        depositsSummary:
          "Dépôts — {{partnerA}}: {{depositA}} / {{partnerB}}: {{depositB}}",
        cashSummary: "Cash: {{cash}} · TR utilisés: {{usedTr}}",
        inputs: {
          a1: "Salaire A",
          a2: "TR bruts A",
          b: "Salaire B",
          b2: "TR bruts B",
          m: "Budget hors TR",
          trPct: "% TR dépensés",
          E: "Dépenses éligibles",
          biasPts: "Biais (pts)",
          advanced: "Mode avancé",
          partnerA: "Nom A",
          partnerB: "Nom B",
        },
      },
      calc: {
        warnings: {
          zeroWeighted: "Somme des revenus pondérés nulle — parts fixées à 50/50 par sécurité.",
          depositBoundedA: "Le dépôt de {{name}} est borné à 0 (sa part est couverte par les tickets resto).",
          depositBoundedB: "Le dépôt de {{name}} est borné à 0 (sa part est couverte par les tickets resto).",
          equalBoundedA: "Dépôt A borné à 0 (reste égalisé).",
          equalBoundedB: "Dépôt B borné à 0 (reste égalisé).",
          trNotFullyUsed: "TR non utilisés intégralement: {{amount}} € non consommés (E < TR).",
        },
        steps: {
          effectiveTr:
            "TR effectifs — {{partnerAName}}: {{valueA}} €, {{partnerBName}}: {{valueB}} € (total {{total}} €)",
          usedTr:
            "TR utilisés — {{partnerAName}}: {{valueA}} €, {{partnerBName}}: {{valueB}} € (total {{total}} €)",
          usedTrCapped:
            "TR utilisés (après plafond E) — {{partnerAName}}: {{valueA}} €, {{partnerBName}}: {{valueB}} € (total {{total}} €)",
          totalPot:
            "Pot total équivalent = m + V = {{m}} + {{v}} = {{total}} €",
          totalPotAdvanced:
            "Pot total M = m + E = {{m}} + {{eligible}} = {{total}} €",
          cashNeeded:
            "Cash à déposer = m = {{cash}} €",
          cashNeededAdvanced:
            "Cash à déposer = m + max(0, E - V) = {{m}} + {{extra}} = {{cash}} €",
          sharesRaw:
            "Parts (avant biais): {{partnerAName}}={{shareA}}% / {{partnerBName}}={{shareB}}%",
          bias:
            "Biais {{bias}} pts ({{direction}}) => {{partnerAName}}={{shareA}}% / {{partnerBName}}={{shareB}}%",
          biasDirection: {
            neutral: "neutre",
            favorA: "favorise {{name}}",
            favorB: "favorise {{name}}",
          },
          contributionEquivalent:
            "Contribution équivalente: {{partnerAName}}={{valueA}} €, {{partnerBName}}={{valueB}} €",
          cashDeposits:
            "Dépôts cash: {{partnerAName}}={{valueA}} €, {{partnerBName}}={{valueB}} € (somme cash={{total}} €)",
          equalModeIntro: "Mode reste à vivre égal : chacun conserve le même reste cash.",
          equalEquation:
            "Égalité du reste cash: {{sa}} - dépôt {{partnerAName}} = {{sb}} - dépôt {{partnerBName}}",
          equalDepositA:
            "Dépôt {{partnerAName}} = (cashNeeded + ({{sa}} - {{sb}})) / 2 = {{depositA}} €",
          equalDepositB:
            "Dépôt {{partnerBName}} = cashNeeded - dépôt {{partnerAName}} = {{cashNeeded}} - {{depositA}} = {{depositB}} €",
          equalBoundedA: "Dépôt {{partnerAName}} borné à 0 pour éviter un dépôt négatif.",
          equalBoundedB: "Dépôt {{partnerBName}} borné à 0 pour éviter un dépôt négatif.",
          contributionEqual:
            "Contribution équivalente (cash + TR): {{partnerAName}}={{valueA}} €, {{partnerBName}}={{valueB}} €",
          leftovers:
            "Restes cash égalisés: {{partnerAName}}={{valueA}} €, {{partnerBName}}={{valueB}} €",
        },
      },
    },
  },
  en: {
    translation: {
      languages: {
        fr: "French",
        en: "English",
      },
      header: {
        title: "💞 Couple balance — calculator",
        description:
          "Adjust your shared contributions in seconds and visualise a balanced, clear and reassuring split.",
        github: "GitHub",
      },
      actions: {
        copyLink: "Copy link",
        copyLinkSuccess: "Link copied to the clipboard.",
        print: "Print / PDF",
        reset: "Reset",
        confirmLoad: "Loading this entry will replace the current values. Continue?",
        confirmClearFirst: "Delete the entire local history?",
        confirmClearSecond: "This action cannot be undone. Confirm deletion?",
      },
      accessibility: {
        modeProportional: "Proportional mode enabled",
        modeEqualLeftover: "Equal leftover mode enabled",
        historyCleared: "History cleared",
        historyLoaded: "Entry from {{date}} loaded",
        toggleDarkMode: "Toggle dark mode",
        info: "More information",
        languageSwitcher: "Change language",
      },
      parameters: {
        title: "Parameters",
        description:
          "Adjust incomes, meal vouchers and the shared budget to obtain a tailored recommendation.",
        partnerNameLabel: "Partner {{label}} name",
        partnerPlaceholder: "Partner {{label}}",
        partnerTooltip: "Customises the name used for partner {{label}} in calculations and charts",
        modeLabel: "Split mode",
        modeTooltip:
          "Proportional: each person contributes based on their means. Equal leftover: both keep the same remaining cash after contributing.",
        modes: {
          proportional: {
            title: "Proportional",
            description: "Each person contributes according to their means, including meal vouchers.",
            announcement: "Proportional mode",
          },
          equal_leftover: {
            title: "Equal leftover",
            description: "Aligns remaining cash after contributing for each partner.",
            announcement: "Equal leftover mode",
          },
        },
        salaryLabel: "Income {{name}}",
        ticketsLabel: "Meal vouchers {{name}}",
        sharedBudgetLabel: "Shared budget excluding vouchers",
        trPctLabel: "% vouchers actually used",
        eligibleLabel: "Voucher-eligible expenses (E)",
        codeSuffix: " ({{code}})",
        trPctTooltip: "Percentage of vouchers actually spent",
        eligibleTooltip: "Monthly amount of eligible expenses (groceries/restaurants) that can be paid with vouchers",
        sharedBudgetTooltip: "Part of the shared budget that cannot be paid with vouchers (cash)",
        salaryTooltip: "Net monthly income of {{name}}",
        ticketsTooltip: "Gross monthly amount of vouchers credited for {{name}}",
        advancedToggle: {
          title: "Advanced mode",
          description: "Add eligible expenses and fine-tune the contribution.",
          helper: "Lets you enter E = voucher-eligible expenses (beyond vouchers)",
        },
        bias: {
          label: "Share adjustment (favour {{partnerA}} or {{partnerB}})",
          summaryNeutral: "Neutral",
          summaryFavor: "Favours {{name}} ({{points}} pts)",
          summaryDetail: "{{points}} points for {{name}}",
          helper:
            "Positive values favour {{partnerB}} ({{partnerA}} pays more). Negative values favour {{partnerA}} ({{partnerA}} pays less).",
          sliderLabel: "Share adjustment ({{partnerA}} ↔ {{partnerB}})",
          favorA: "Favour {{name}}",
          favorB: "Favour {{name}}",
          neutral: "Neutral",
          disabled: "Bias not available in \"Equal leftover\" mode.",
        },
        suffix: {
          euroMonth: "€/month",
          percent: "%",
        },
      },
      summary: {
        title: "Summary",
        description:
          "Instant overview of the split and each partner's contribution level.",
        labels: {
          share: "Share {{name}}",
          deposit: "Deposit {{name}}",
          leftover: "Leftover {{name}}",
          totalCash: "Total cash to deposit",
          usedTr: "Vouchers used (V)",
          totalPot: "Total pot (M)",
          warnings: "Warnings",
        },
        chart: {
          title: "Contribution breakdown",
          centerPercent: "Total (%)",
          centerAmount: "Total (€)",
          deposit: "Deposit {{name}}",
          tr: "Voucher {{name}}",
        },
        saveBlock: {
          title: "Save this configuration",
          description: "Entries are stored locally on this device.",
          addNote: "Add a note",
          save: "Save to history",
        },
      },
      calculationInfo: {
        aria: "Understand the calculation models",
        toggle: "Understand the calculation",
        sectionTitle: "Understand the two models",
        objectiveTitle: "🎯 Objective",
        objectiveText:
          "Split shared expenses according to each person's means so that the perceived effort stays comparable, without forcing a strict 50/50 split.",
        modelsTitle: "⚖️ Two models",
        proportionalTitle: "⚖️ Model 1 — Proportional to income (with vouchers)",
        proportionalList: [
          "Computes real means: salaries + vouchers actually spent.",
          "Assigns each a share proportional to those means.",
          "Subtracts vouchers already used before asking for cash.",
          "Adjusts the shared budget by including the eligible share of vouchers.",
        ],
        equalTitle: "⚖️ Model 2 — Equal leftover",
        equalList: [
          "Targets the same remaining cash for A and B after contributing.",
          "Splits the required deposit to align those leftovers.",
          "Includes vouchers already used to reduce the cash effort.",
          "Compensates when one side would contribute negatively (clamped to 0).",
        ],
        trTitle: "🍽️ Meal vouchers",
        trText:
          "Vouchers count as in-kind contributions on eligible expenses. Only the amount actually spent is included.",
        biasTitle: "🎚️ Bias",
        biasText:
          "The bias slider lets you slightly shift shares to address discomfort or balance personal expenses.",
        limitsTitle: "🧩 Limits",
        limitsList: [
          "Adapt the % of vouchers if not all of them are spent on shared expenses.",
          "Watch the non-eligible budget share to assess perceived effort.",
          "Account for personal expenses if they differ greatly.",
        ],
        detailsLink: "View detailed formulas",
      },
      details: {
        title: "Calculation details",
        show: "Show details",
        hide: "Hide details",
        warnings: "Warnings",
        note: "Note: meal vouchers count as an <strong>in-kind contribution</strong>.",
      },
      glossary: {
        aria: "Contextual glossary",
        title: "Glossary",
        terms: [
          {
            term: "m",
            description: "Cash to feed the shared budget (expenses not eligible to vouchers).",
          },
          {
            term: "E",
            description: "Monthly eligible expenses that exceed available vouchers.",
          },
          {
            term: "V",
            description: "Total vouchers actually used in the calculation (after applying the effective %).",
          },
          {
            term: "Effective vouchers",
            description:
              "Voucher amount counted after applying the percentage actually spent.",
          },
          {
            term: "Total pot (M)",
            description:
              "Shared pot used to split expenses: cash m + eligible expenses (E) or vouchers used (V).",
          },
          {
            term: "Bias",
            description:
              "Manual adjustment of the ratio: positive values favour B (A pays more), negative values favour A (A pays less).",
          },
        ],
      },
      history: {
        title: "History",
        description: "Up to 60 entries are stored on this device.",
        clear: "Clear all",
        noteLabel: "Note",
        notePlaceholder: "Oct. 2025 – new rent",
        searchLabel: "Search",
        searchPlaceholder: "Filter by note or month",
        periodLabel: "Period",
        periodOptions: {
          all: "All",
          three: "Last 3 months",
          six: "Last 6 months",
          twelve: "Last 12 months",
        },
        save: "Save to history",
        maxWarning:
          "Maximum capacity reached. The next entry will replace the oldest one.",
        empty: "No entry matches your search.",
        listLabel: "History of saved calculations",
        listActions: "Actions for the entry from {{label}}",
        load: "Load",
        details: "Details",
        delete: "Delete",
        loadAria: "Load the entry from {{label}}",
        detailsAria: "Show the entry details from {{label}}",
        deleteAria: "Delete the entry from {{label}}",
        boolYes: "Yes",
        boolNo: "No",
        defaultValue: "(default)",
        noNote: "(no note)",
        depositsSummary:
          "Deposits — {{partnerA}}: {{depositA}} / {{partnerB}}: {{depositB}}",
        cashSummary: "Cash: {{cash}} · Vouchers used: {{usedTr}}",
        inputs: {
          a1: "Income A",
          a2: "Vouchers gross A",
          b: "Income B",
          b2: "Vouchers gross B",
          m: "Budget without vouchers",
          trPct: "% vouchers spent",
          E: "Eligible expenses",
          biasPts: "Bias (pts)",
          advanced: "Advanced mode",
          partnerA: "Name A",
          partnerB: "Name B",
        },
      },
      calc: {
        warnings: {
          zeroWeighted:
            "Weighted income sum is zero — shares forced to 50/50 for safety.",
          depositBoundedA:
            "Deposit for {{name}} clamped to 0 (their share is covered by vouchers).",
          depositBoundedB:
            "Deposit for {{name}} clamped to 0 (their share is covered by vouchers).",
          equalBoundedA: "Deposit A clamped to 0 (leftover equalised).",
          equalBoundedB: "Deposit B clamped to 0 (leftover equalised).",
          trNotFullyUsed: "Vouchers not fully used: {{amount}} € unused (E < vouchers).",
        },
        steps: {
          effectiveTr:
            "Effective vouchers — {{partnerAName}}: {{valueA}} €, {{partnerBName}}: {{valueB}} € (total {{total}} €)",
          usedTr:
            "Vouchers used — {{partnerAName}}: {{valueA}} €, {{partnerBName}}: {{valueB}} € (total {{total}} €)",
          usedTrCapped:
            "Vouchers used (after E cap) — {{partnerAName}}: {{valueA}} €, {{partnerBName}}: {{valueB}} € (total {{total}} €)",
          totalPot:
            "Equivalent total pot = m + V = {{m}} + {{v}} = {{total}} €",
          totalPotAdvanced:
            "Total pot M = m + E = {{m}} + {{eligible}} = {{total}} €",
          cashNeeded: "Cash to deposit = m = {{cash}} €",
          cashNeededAdvanced:
            "Cash to deposit = m + max(0, E - V) = {{m}} + {{extra}} = {{cash}} €",
          sharesRaw:
            "Shares (before bias): {{partnerAName}}={{shareA}}% / {{partnerBName}}={{shareB}}%",
          bias:
            "Bias {{bias}} pts ({{direction}}) => {{partnerAName}}={{shareA}}% / {{partnerBName}}={{shareB}}%",
          biasDirection: {
            neutral: "neutral",
            favorA: "favours {{name}}",
            favorB: "favours {{name}}",
          },
          contributionEquivalent:
            "Equivalent contribution: {{partnerAName}}={{valueA}} €, {{partnerBName}}={{valueB}} €",
          cashDeposits:
            "Cash deposits: {{partnerAName}}={{valueA}} €, {{partnerBName}}={{valueB}} € (cash total={{total}} €)",
          equalModeIntro: "Equal leftover mode: both keep the same remaining cash.",
          equalEquation:
            "Equal remaining cash: {{sa}} - deposit {{partnerAName}} = {{sb}} - deposit {{partnerBName}}",
          equalDepositA:
            "Deposit {{partnerAName}} = (cashNeeded + ({{sa}} - {{sb}})) / 2 = {{depositA}} €",
          equalDepositB:
            "Deposit {{partnerBName}} = cashNeeded - deposit {{partnerAName}} = {{cashNeeded}} - {{depositA}} = {{depositB}} €",
          equalBoundedA: "Deposit {{partnerAName}} clamped to 0 to avoid a negative deposit.",
          equalBoundedB: "Deposit {{partnerBName}} clamped to 0 to avoid a negative deposit.",
          contributionEqual:
            "Equivalent contribution (cash + vouchers): {{partnerAName}}={{valueA}} €, {{partnerBName}}={{valueB}} €",
          leftovers:
            "Equalised cash leftovers: {{partnerAName}}={{valueA}} €, {{partnerBName}}={{valueB}} €",
        },
      },
    },
  },
};

if (!i18n.isInitialized) {
  void i18n.use(initReactI18next).init({
    resources,
    fallbackLng,
    lng: getInitialLanguage(),
    interpolation: {
      escapeValue: false,
    },
    returnObjects: true,
  });
}

if (typeof window !== "undefined") {
  i18n.on("languageChanged", (lng) => {
    window.localStorage.setItem(STORAGE_KEY, lng);
  });
}

export { resources };
export default i18n;
