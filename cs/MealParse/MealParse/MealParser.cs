using HtmlAgilityPack;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace MealParse
{
    public static class MealParser
    {
        private static string Food = string.Empty;
        public static bool IsExitDay { get; private set; }

        #region TODO 학교 정보
        private static readonly string SCHOOL_COUNTRY = "dge.go";
        private static readonly string SCHOOL_CODE = "D100000282";
        private static readonly int SCHOOL_TYPE = 4;
        #endregion

        public static async Task<string> GetMealAsync()
        {
            string url = "https://stu." + SCHOOL_COUNTRY + ".kr/sts_sci_md00_001.do?schulCode=" + SCHOOL_CODE + "&schulCrseScCode=" + SCHOOL_TYPE + "&schulKndScCode=0" + SCHOOL_TYPE + "&schYm=" + DateTime.Now.ToString("yyyyMM");
            HtmlWeb web = new HtmlWeb();
            HtmlDocument doc = await web.LoadFromWebAsync(url);

            HtmlNode docNodes = doc.DocumentNode;

            var query = from table in docNodes.Descendants("tbody")
                        from row in table.Descendants("tr")
                        from cell in row.Descendants("td")
                        from content in cell.Descendants("div")
                        select new { Table = table.Id, CellText = cell.InnerText, CellHtml = cell.InnerHtml, ContentHtml = content.InnerHtml };

            foreach (var content in query)
            {
                string text = content.ContentHtml;
                string[] chunk = text.Split("<br/>".ToCharArray());

                for (int i = 0; i < chunk.Length; i++)
                {
                    if (chunk[i].Contains(DateTime.Now.Day.ToString()) && chunk[i].IndexOf(DateTime.Now.Day.ToString()) == 0)
                    {
                        chunk[i] = chunk[i].Replace(DateTime.Now.Day.ToString(), "");
                        Parshing(chunk);
                    }
                }
            }

            return Food;
        }

        public static async Task<string> GetMealAsync(int month, int day)
        {
            DateTime now = DateTime.Now;
            DateTime date = now;
            if (month - date.Month != 0 || day - date.Day != 0)
                date = date.AddMonths(month - date.Month).AddDays(day - date.Day);
            string url = "https://stu." + SCHOOL_COUNTRY + ".kr/sts_sci_md00_001.do?schulCode=" + SCHOOL_CODE + "&schulCrseScCode=" + SCHOOL_TYPE + "&schulKndScCode=0" + SCHOOL_TYPE + "&schYm=" + date.ToString("yyyyMM");
            HtmlWeb web = new HtmlWeb();
            HtmlDocument doc = await web.LoadFromWebAsync(url);

            HtmlNode docNodes = doc.DocumentNode;

            var query = from table in docNodes.Descendants("tbody")
                        from row in table.Descendants("tr")
                        from cell in row.Descendants("td")
                        from content in cell.Descendants("div")
                        select new { Table = table.Id, CellText = cell.InnerText, CellHtml = cell.InnerHtml, ContentHtml = content.InnerHtml };

            foreach (var content in query)
            {
                string text = content.ContentHtml;
                string[] chunk = text.Split("<br/>".ToCharArray());

                for (int i = 0; i < chunk.Length; i++)
                {
                    if (chunk[i].Contains(day.ToString()) && chunk[i].IndexOf(day.ToString()) == 0)
                    {
                        chunk[i] = chunk[i].Replace(day.ToString(), "");
                        Parshing(chunk);
                    }

                    if (chunk[i].Contains(day.ToString()) && !chunk[i].Contains("[석식]") && chunk[i].IndexOf(day.ToString()) == 0)
                    {
                        if (DateTime.Compare(now, date) == -1 || DateTime.Compare(now, date) == 0)
                            IsExitDay = true;
                    }
                }
            }

            return Food;
        }

        private static void Parshing(string[] texts)
        {
            string data = string.Empty;
            foreach (string tmp in texts)
            {
                data += tmp;
            }

            foreach (string text in texts)
            {
                if (text.Trim().Length < 1)
                    continue;

                if (Food.Length > 1)
                    Food += "\n" + text.Replace("[중식]", "\n[중식]").Replace("[석식]", "\n[석식]");
                else
                    Food += text;
            }
        }
    }
}
